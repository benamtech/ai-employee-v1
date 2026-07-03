# Generated per client by provision_employee (Phase 1). One subdomain → one gateway port.
# {{CLIENT_ID}} → port {{GATEWAY_PORT}}. The client's Twilio number points its SMS webhook
# at https://{{CLIENT_SLUG}}.agents.amtechai.com/webhooks/twilio. Blast radius stays per-client.
{{CLIENT_SLUG}}.agents.amtechai.com {
	reverse_proxy localhost:{{GATEWAY_PORT}}
}
