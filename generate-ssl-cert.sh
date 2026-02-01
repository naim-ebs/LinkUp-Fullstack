#!/bin/bash

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Generate self-signed SSL certificate for development
openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.cert -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=192.168.20.187" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:192.168.20.187"

echo "SSL certificates generated successfully in ssl/ directory"
echo "Note: These are self-signed certificates for development only"
echo "You may need to accept the security warning in your browser"
