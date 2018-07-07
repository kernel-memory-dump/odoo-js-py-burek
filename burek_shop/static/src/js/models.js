odoo.define('burek.classes', function (require) {
'use strict';

var Class = require('web.Class');
var rpc = require('web.rpc');


/**
 * Burek
 * Model from the Odoo Backend
 * @type {OdooClass}
 */
var Burek = Class.extend({
    init: function (values) {
        Object.assign(this, values);
    },
    /**
     * @return {jQuery.Deferred} o the updated
     *                           burek if successful.
     */
    update: function () {
        var self = this;
        return rpc.query({
            model: 'burek.burek',
            method: 'read',
            args: [[this.id]],
            kwargs: {fields: ['id', 'name', 'description']}
        }).then(function (burek_values) {
            Object.assign(self, burek_values[0]);
            return self;
        });
    },
});


/**
 * User
 * Represent a res.users from the Odoo Backend, with only
 * the fields [id, login, name, image_small] accessible by
 * default.
 * The User class also represent a burek collection.
 * @type {OdooClass}
 */
var User = Class.extend({
    init: function (values) {
        Object.assign(this, values);
        this.bureks = [];
    },
    /**
     * Create a burek on the server via rpc call and create it
     * client-side in the User bureks' collection on success.
     * @param  {Object} values Object containing the 'name'
     *                         and 'description' content for
     *                         the new burek
     * @return {jQuery.Deferred} The newly created burek.
     */
    createburek: function (values) {
        var self = this;
        var burek_values = {
            name: values.name,
            description: values.description
        };
        return rpc.query({
            model: 'demo.burek',
            method: 'create',
            args: [burek_values]
        }).then(function (burek_id) {
            var burek = new burek({id: burek_id});
            self.bureks.push(burek);
            return burek.update();
        });
    },
    /**
     * Fetch the default fields for the user on the server.
     * @return {jQuery.Deferred} Resolves to the udpate User.
     */
    fetchUserInfo: function () {
        var self = this;
        return rpc.query({
            model: 'res.users',
            method: 'read',
            args: [[this.id]],
            kwargs: {fields: ['id', 'login', 'name', 'image_small', 'partner_id']}
        }).then(function (user_values) {
            var values = user_values[0];
            values.partner_id = values.partner_id[0];
            Object.assign(self, values);
            return self;
        });
    },
    /**
     * Fetch all available bureks for the current user.
     * Note that the actual search is done server side
     * using the model's ACLs and Access Rules.
     * @return {jQuery.Deferred} Resolves to the udpated User
     *                           (with its bureks collection
     *                           populated).
     */
    fetchAllbureks: function () {
        var self = this;
        return rpc.query({
            model: 'demo.burek',
            method: 'search_read',
            args: [[]],
            kwargs: {fields: ['id', 'name', 'description']}
        }).then(function (burek_values) {
            for (var vals of burek_values) {
                self.bureks.push(new burek(vals));
            }
            return self;
        });
    },
    /**
     * Fetch a specified burek id for the current user.
     * @param  {Integer} id ID of the burek to fetch.
     * @return {jQuery.Deferred} Resolves to the new burek
     */
    fetchburek: function (id) {
        var self = this;
        return rpc.query({
            model: 'demo.burek',
            method: 'search_read',
            args: [[['id', '=', id]]],
            kwargs: {fields: ['id', 'name', 'description']}
        }).then(function (burek_values) {
            if (burek_values.length) {
                var burek = new burek(burek_values[0]);
                self.bureks.push(burek);
            }
            return burek;
        });
    },
    /**
     * Remove a specified burek id from the collections.
     * @param  {Integer} id ID of the burek to remove
     */
    removeburek: function (id) {
        var t_idx = this.bureks.findIndex(t => t.id === id);
        if (t_idx !== -1) {
            this.bureks.splice(t_idx, 1);
        }
    },
});

return {
    burek: burek,
    User: User,
};
});