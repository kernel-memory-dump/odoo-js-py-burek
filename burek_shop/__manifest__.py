# -*- encoding: utf-8 -*-
{
    'name': 'Burek',
    'version': '0.0.1',
    'author': 'Sebastian Novak',
    'website': 'https://kernel-memory-dump',
    'summary': 'Demo a WebApp to get some burek',
    'depends': ['web', 'base_setup', 'bus'],
    'description': """
Burek Demo
==================
Trying out ODO, going to get some burek
""",
    "data": [
        "views/burek_views.xml",
        "views/burek_templates.xml",
        "data/ir.model.access.csv",
        "data/burek_security.xml",
    ],
    "burek": [
        "burek/burek_demo.xml",
    ],
    'installable': True,
    'application': True,
    'license': 'WTF',
}
