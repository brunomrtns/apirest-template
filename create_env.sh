#!/bin/bash

ask() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    local input

    if [ -n "$default" ]; then
        prompt="$prompt [$default]: "
    else
        prompt="$prompt: "
    fi

    read -p "$prompt" input
    input="${input:-$default}"
    eval "$var_name=\"$input\""
}

ask "Enter MYSQL password" MYSQL_PASSWORD
ask "Enter Gmail password" GMAIL_PASSWORD
ask "Enter Gmail email" GMAIL_EMAIL
ask "Sync database? (true/false)" SYNC_DATABASE false
ask "Enter interface IP" INTERFACE_IP
ask "Enter JWT secret" JWT_SECRET

cat <<EOF > .env
MYSQL_PASSWORD=$MYSQL_PASSWORD
GMAIL_PASSWORD=$GMAIL_PASSWORD
GMAIL_EMAIL=$GMAIL_EMAIL
SYNC_DATABASE=$SYNC_DATABASE
INTERFACE_IP=$INTERFACE_IP
JWT_SECRET=$JWT_SECRET
EOF

echo ".env file created successfully!"
