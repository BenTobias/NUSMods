define([
  'backbone',
  'jquery.ui.draggable',
  'jquery.ui.droppable',
  'jquery.ui.touch-punch'
], function(Backbone) {
  'use strict';

  var LessonView = Backbone.View.extend({
    className: 'lesson',
    template: _.template($('#lesson-template').html()),
    tooltipTemplate:_.template($('#tooltip-template').html()),

    TR: $('#mon > tr:last-child').clone(),

    initialize: function() {
      this.model.on('change', this.render, this);
      this.model.on('destroy', this.remove, this);
      _.bindAll(this, 'drop', 'out', 'over', 'revert', 'start');
      this.$el.data('lesson', this.model);
    },

    render: function() {
      var modelJSON = this.model.toJSON();
      this.$el.html(this.template(modelJSON));
      this.$el.addClass('color' + this.model.get('color'));
      if (this.model.get('isDraggable')) {
        this.$el.addClass('ui-draggable');
      }
      this.$el.qtip({
        content: this.tooltipTemplate(modelJSON),
        position: {
          my: 'left center',
          at: 'right center'
        },
        show: {
          effect: function() {
            $(this).fadeTo(200, 0.85);
          }
        }
      });
      if (this.options.droppables) {
        this.$el.droppable({
          activeClass: 'active',
          addClasses: false,
          hoverClass: 'hover',
          drop: this.drop,
          over: this.over,
          out: this.out
        });
      } else if (this.model.get('isDraggable')) {
        this.$el.draggable({
          addClasses: false,
          appendTo: '#timetable-wrapper',
          cursor: 'move',
          helper: function() {
            return $(this).clone().width($(this).width()).height($(this).height());
          },
          opacity: 0.4,
          revert: this.revert,
          start: this.start,
          zIndex: 3
        });
      }

      if (this.model.get('day') === 5) {
        $('#sat').show();
      }
      var rows = $('#' + this.model.get('dayAbbrev') + ' > tr');
      for (var i = 0; i <= rows.length; i++) {
        var row = rows[i];
        if (i === rows.length) {
          row = this.TR.clone().appendTo('#' + this.model.get('dayAbbrev'));
          $(rows[0]).children().first().attr('rowspan', i + 1);
        }
        var td;
        if (td = $(row).children('.h' + this.model.get('start').slice(0, 2) + '.m' + this.model.get('start').slice(2) + ':empty')) {
          this.detached = td.nextUntil('.h' + this.model.get('end').slice(0, 2) + '.m' + this.model.get('end').slice(2), 'td:empty');
          if (this.detached.length === this.model.get('duration') - 1) {
            td.attr('colspan', this.model.get('duration')).html(this.$el);
            this.detached.detach();
            break;
          }
        }
      }
      return this;
    },

    out: function() {
      this.$el.qtip('hide');
      var group = this.model.get('group');
      _.each(this.options.droppables, function(lessonView) {
        if (lessonView.model.get('group') == group) {
          lessonView.$el.removeClass('hover');
        }
      });
    },

    over: function() {
      this.$el.qtip('show');
      var group = this.model.get('group');
      _.each(this.options.droppables, function(lessonView) {
        if (lessonView.model.get('group') == group) {
          lessonView.$el.addClass('hover');
        }
      });
    },

    drop: function() {
      _.each(this.options.droppables, function(lessonView) {
        lessonView.remove();
      });
      this.options.timetable.remove(this.options.timetable.where({
        code: this.model.get('code'),
        type: this.model.get('type')
      }));
      this.model.get('sameGroup').each(function(lesson) {
        this.options.timetable.add(lesson);
      }, this);
    },

    revert: function(droppable) {
      $('body').css('cursor', 'auto');
      if (droppable) {
        return false;
      } else {
        _.each(this.options.droppables, function(lessonView) {
          lessonView.remove();
        });
        return true;
      }
    },

    start: function() {
      var group = this.model.get('group');
      this.options.droppables = [];
      this.model.get('sameType').each(function(lesson) {
        if (lesson.get('group') !== group) {
          this.options.droppables.push((new LessonView({
            model: lesson,
            droppables: this.options.droppables,
            timetable: this.options.timetable
          })).render());
        }
      }, this);
    },

    remove: function() {
      var tr = this.$el.parent().removeAttr('colspan').after(this.detached).parent();
      this.$el.remove();
      if (!tr.find('.lesson').length && tr.index() > 1) {
        tr.remove();
      }
    }
  });

  return LessonView;
});