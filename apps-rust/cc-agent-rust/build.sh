set -ex

#
#cd c
#
#ln -s llvm-ar aarch64-linux-android-ar
#
## Create compatibility symlinks
#ln -s aarch64-linux-android33-clang aarch64-linux-android-clang
#ln -s aarch64-linux-android33-clang++ aarch64-linux-android-clang++
#
## Create compatibility symlinks
#ln -s x86_64-linux-android33-clang x86_64-linux-android-clang
#ln -s x86_64-linux-android33-clang++ x86_64-linux-android-clang++
#ln -s llvm-ar x86_64-linux-android-ar

export CC_aarch64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android-clang"
export CXX_aarch64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android-clang++"
export AR_aarch64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android-ar"

export CC_x86_64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/x86_64-linux-android-clang"
export CXX_x86_64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/x86_64-linux-android-clang++"
export AR_x86_64_linux_android="/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/x86_64-linux-android-ar"

cargo build --target=aarch64-linux-android --release
chmod +x ../../target/aarch64-linux-android/release/cc-agent-rust

adb push ../../target/aarch64-linux-android/release/cc-agent-rust /data/local/tmp
adb shell /data/local/tmp/cc-agent-rust -d
cp ../../target/aarch64-linux-android/release/cc-agent-rust ../cici-server/public/static/assets/cc-agent-rust-arm64
ls -alh ../cici-server/public/static/assets/


cargo build --target=x86_64-linux-android --release

chmod +x ../../target/x86_64-linux-android/release/cc-agent-rust
#adb push ../../target/x86_64-linux-android/release/cc-agent-rust /data/local/tmp

cp ../../target/x86_64-linux-android/release/cc-agent-rust ../cici-server/public/static/assets/cc-agent-rust-386
ls -alh ../cici-server/public/static/assets/



