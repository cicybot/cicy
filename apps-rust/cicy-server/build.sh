set -ex


cargo build --release
chmod +x ../../target/release/cicy-server

cp ../../target/release/cicy-server ../../apps/desktop/public/static/assets/cicy-server-0.0.0-darwin-x64
