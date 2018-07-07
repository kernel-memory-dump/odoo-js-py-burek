# -*- encoding: utf-8 -*-
from odoo import api, fields, models


class Demoburek(models.Model):
    _name = 'demo.burek'
    _description = 'Demo burek'

    name = fields.Char(required=True)
    description = fields.Text()
    partner_id = fields.Many2one('res.partner', string='Customer', required=True, default=lambda s: s.env.user.partner_id)

    @api.model
    def create(self, vals):
        burek = super(Demoburek, self).create(vals)
        (channel, message) = ((self._cr.dbname, 'demo.burek', burek.partner_id.id), ('new_burek', burek.id))
        self.env['bus.bus'].sendone(channel, message)
        return burek

    def unlink(self):
        notifications = []
        for burek in self:
            notifications.append(((self._cr.dbname, 'demo.burek', burek.partner_id.id), ('unlink_burek', burek.id)))
        self.env['bus.bus'].sendmany(notifications)
        return super(Demoburek, self).unlink()
