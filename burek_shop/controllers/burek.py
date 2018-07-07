# -*- encoding: utf-8 -*-

from odoo import http
 
 # BusController
 # Other API Controllers, @api.route
 # @api.route is cool, burek myes
class Example(http.Controller):
    
    @http.route('/burek', type='http', auth='public', website=True)
    def render_burek_landing_page(self):
        return http.request.render('burek.burek_landing_page', {})



