FROM n8nio/n8n:1.34.0
copy packages/cli/dist/License* /usr/local/lib/node_modules/n8n/dist/
copy packages/cli/dist/config/* /usr/local/lib/node_modules/n8n/dist/config/
copy packages/cli/dist/controllers/* /usr/local/lib/node_modules/n8n/dist/controllers/

