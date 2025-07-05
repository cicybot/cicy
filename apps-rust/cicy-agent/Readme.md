# 初始化 Rust

    cd apps
    cargo new rust_hello

# Rust run

    cargo run
    cargo run -- -h

## arm64

    subl ~/.cargo/config.toml
    [target.aarch64-linux-android]
    linker = "/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android33-clang"
    ar = "/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-ar"


    rustup target add aarch64-linux-android
    cargo build --target=aarch64-linux-android --release


## x86_64

    rustup target add x86_64-linux-android

    subl ~/.cargo/config.toml
    [target.x86_64-linux-android]
    linker = "/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/x86_64-linux-android33-clang"
    ar = "/Users/ton/Desktop/Android/sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-ar"



    cargo build --target=x86_64-linux-android --release

