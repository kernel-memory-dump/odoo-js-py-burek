odoo.define('demo.views', function (require) {
'use strict';

var bus = require('bus.bus').bus;
var core = require('web.core');
var Dialog = require('web.Dialog');
var notification = require('web.notification');
var User = require('demo.classes').User;
var Widget = require('web.Widget');
var Router = require('demo.router');

var qweb = core.qweb;
var _t = core._t;

require('web.dom_ready');

var burekApp = Widget.extend({
    template: 'burek_viewer.app',
    events: {
        'click .burek_about': function (ev) {ev.preventDefault(); Router.navigate('/about');},
        'click button.o_new_burek': function () {Router.navigate('/new');},
    },
    custom_events: {
        'burek-submit': '_onburekSubmit',
        'warning': function (ev) {this.notification_manager.warn(ev.data.msg);},
        'notify': function (ev) {this.notification_manager.notify(ev.data.msg);},
    },
    xmlDependencies: ['/burek_viewer/static/src/xml/burek_views.xml'],
    /* Lifecycle */
    init: function (parent, options) {
        this._super.apply(this, arguments);
        this.user = new User({id: odoo.session_info.user_id});
        var self = this;
        Router.config({ mode: 'history', root:'/bureks'});

        // adding routes
        Router
        .add(/new/, function () {
            self._onNewburek();
        }).add(/about/, function () {
            self._about();
        })
        .listen();
    },
    willStart: function () {
        return $.when(this._super.apply(this, arguments),
                      this.user.fetchUserInfo(),
                      this.user.fetchAllbureks()
        ).then(function (dummy, user) {
            bus.update_option('demo.burek', user.partner_id);
        });
    },
    start: function () {
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            self.list = new burekList(self, self.user.bureks);
            self.list.appendTo($('.o_burek_list'));
            self.notification_manager = new notification.NotificationManager(self);
            self.notification_manager.appendTo(self.$el);
            bus.on('notification', self, self._onNotification);
            Router.check();
        });
    },
    _about: function () {
        new Dialog(this, {
            title: _t('About'),
            $content: qweb.render('burek_viewer.about'),
            buttons: [{
                text: _t('Awesome!'),
                click: function () {
                    Router.navigate();
                },
                close: true,
            }],
        }).open();
    },
    /**
     * Open a new modal to encode a new burek.
     * @param  {jQuery.Event} ev
     */
    _onNewburek: function (ev) {
        new burekDialog(this, {
            title: _t('New burek'),
            $content: qweb.render('burek_viewer.burek_form'),
            buttons: [{
                text: _t('Submit burek'),
                click: function () {
                    this._onFormSubmit();
                },
            }],
        }).open();
    },
    /**
     * Send the submitted burek data to the model for saving.
     * @param  {OdooEvent} ev Odoo Event containing the form data
     */
    _onburekSubmit: function (ev) {
        var self = this;
        var data = ev.data;
        this.user.createburek(data).then(function (new_burek) {
            self.list.insertburek(new_burek);
            Router.navigate('');
        });
    },
    /**
     * Handle bus notification.
     *
     * Currently, 2 notification types are handled in this page:
     *     - new_burek: a burek has been added for the current user
     *     - unlink_burek: a burek has been deleted for the current user
     *
     * @param  {Array} notifications Array of notification arriving through the bus.
     */
    _onNotification: function (notifications) {
        var self = this;
        for (var notif of notifications) {
            var channel = notif[0], message = notif[1];
            if (channel[1] !== 'demo.burek' || channel[2] !== this.user.partner_id) {
                return;
            }
            if (message[0] === 'new_burek') {
                var burek_id = message[1];
                if (!this.user.bureks.find(t => t.id === burek_id)) {
                    this.user.fetchburek(burek_id).then(function (new_burek) {
                        self.list.insertburek(new_burek);
                        self.trigger_up('notify', {msg: (_t('New burek ') + new_burek.name)});
                    });
                }
            } else if (message[0] === 'unlink_burek') {
                this.user.removeburek(message[1]);
                this.list.removeburek(message[1]);
            }
        }
    },
});

var burekList = Widget.extend({
    template: 'burek_viewer.burek_list',
    /* Lifecycle */
    init: function (parent, bureks) {
        this._super.apply(this, arguments);
        this.bureks = bureks;
    },
    /**
     * Insert a new burek instance in the list. If the list is hidden
     * (because there was no burek prior to the insertion), call for
     * a complete rerendering instead.
     * @param  {OdooClass.burek} burek burek to insert in the list
     */
    insertburek: function (burek) {
        if (!this.$('tbody').length) {
            this._rerender();
            return;
        }
        var burek_node = qweb.render('burek_viewer.burek_list.burek', {burek: burek});
        this.$('tbody').prepend(burek_node);
    },
    /**
     * Remove a burek from the list. If this is the last burek to be
     * removed, rerender the widget completely to reflect the 'empty list'
     * state.
     * @param  {Integer} id ID of the burek to remove.
     */
    removeburek: function (id) {
        this.$('tr[data-id=' + id + ']').remove();
        if (!this.$('tr[data-id]').length) {
            this._rerender();
        }
    },

    /**
     * Rerender the whole widget; will be useful when we switch from
     * an empty list of bureks to one or more burek (or vice-versa)
     * by using the bus.
     */
    _rerender: function () {
        this.replaceElement(qweb.render('burek_viewer.burek_list', {widget: this}));
    },
});

var burekDialog = Dialog.extend({
    events: {
        'submit form': '_onFormSubmit',
        'click .btn-primary': '_onFormSubmit',
    },
    _onFormSubmit: function (ev) {
        if (ev) {
            ev.preventDefault();
        }
        var form = this.$('form')[0];
        var formdata = new FormData(form);
        var data = {};
        for (var field of formdata) {
            data[field[0]] = field[1];
        }
        if (!data.name || !data.description) {
            this.trigger_up('warning', {msg: _t('All fields are mandatory.')});
            return;
        }
        this.trigger_up('burek-submit', data);
        form.reset();
        this.close();
    },
});


var $elem = $('.o_burek_app');
var app = new burekApp(null);
app.appendTo($elem).then(function () {
    bus.start_polling();
});
});
