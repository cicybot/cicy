set -ex

export CC_aarch64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android33-clang"
export AR_aarch64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-ar"

export CC_x86_64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/x86_64-linux-android-clang"
export AR_x86_64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-ar"

cargo build --target=aarch64-linux-android --release
chmod +x ../../target/aarch64-linux-android/release/cicy-agent

adb push ../../target/aarch64-linux-android/release/cicy-agent /data/local/tmp
adb shell /data/local/tmp/cicy-agent -d
cp ../../target/aarch64-linux-android/release/cicy-agent ../../apps/desktop/public/static/assets/cicy-agent-v0.0.0-arm64
ls -alh ../../apps/desktop/public/static/assets/


cargo build --target=x86_64-linux-android --release
chmod +x ../../target/x86_64-linux-android/release/cicy-agent

cp ../../target/x86_64-linux-android/release/cicy-agent ../../apps/desktop/public/static/assets/cicy-agent-v0.0.0-x86_64
ls -alh ../../apps/desktop/public/static/assets/



