set -ex


cargo build --release
chmod +x ../../target/release/cicy-connector

cp ../../target/release/cicy-connector ../../apps/desktop/public/static/assets/cicy-connector-v0.0.0-darwin-x64
