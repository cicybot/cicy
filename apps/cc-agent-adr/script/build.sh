CUR_DIR=
get_cur_dir() {
    # Get the fully qualified path to the script
    case $0 in
        /*)
            SCRIPT="$0"
            ;;
        *)
            PWD_DIR=$(pwd);
            SCRIPT="${PWD_DIR}/$0"
            ;;
    esac
    # Resolve the true real path without any sym links.
    CHANGED=true
    while [ "X$CHANGED" != "X" ]
    do
        # Change spaces to ":" so th`e tokens can be parsed.
        SAFESCRIPT=`echo $SCRIPT | sed -e 's; ;:;g'`
        # Get the real path to this script, resolving any symbolic links
        TOKENS=`echo $SAFESCRIPT | sed -e 's;/; ;g'`
        REALPATH=
        for C in $TOKENS; do
            # Change any ":" in the token back to a space.
            C=`echo $C | sed -e 's;:; ;g'`
            REALPATH="$REALPATH/$C"
            # If REALPATH is a sym link, resolve it.  Loop for nested links.
            while [ -h "$REALPATH" ] ; do
                LS="`ls -ld "$REALPATH"`"
                LINK="`expr "$LS" : '.*-> \(.*\)$'`"
                if expr "$LINK" : '/.*' > /dev/null; then
                    # LINK is absolute.
                    REALPATH="$LINK"
                else
                    # LINK is relative.
                    REALPATH="`dirname "$REALPATH"`""/$LINK"
                fi
            done
        done

        if [ "$REALPATH" = "$SCRIPT" ]
        then
            CHANGED=""
        else
            SCRIPT="$REALPATH"
        fi
    done
    # Change the current directory to the location of the script
    CUR_DIR=$(dirname "${REALPATH}")
}

get_cur_dir
PROJECT_DIR=$(dirname "$(dirname "$(dirname "${CUR_DIR}")")")
echo PROJECT_DIR: $PROJECT_DIR
cd $PROJECT_DIR/apps/cc-agent-adr
sed -i '' "s/const val UseLocal = .*/const val UseLocal = true/" app/src/main/java/com/web3desk/adr/common.kt

buildTarget() {
  local target=$1
  echo "[+] BuildTarget $target"
  cp app/libs/libclash-"$target".aar app/libs/libclash.aar
  ./gradlew assembleDebug
  cp app/libs/libclash-arm64.aar app/libs/libclash.aar
  rm -rf "$PROJECT_DIR"/apps/desktop/public/static/assets/app-v0.0.0-"$target".apk
  mv app/build/outputs/apk/debug/app-debug.apk "$PROJECT_DIR"/apps/desktop/public/static/assets/app-v0.0.0-"$target".apk
  ls -al "$PROJECT_DIR"/apps/desktop/public/static/assets/
}

targets="arm64 armv7a x86_64"

if [ "$1" = "arm64" ]; then
  target="arm64"
  buildTarget "$target"
elif [ "$1" = "armv7a" ]; then
  target="armv7a"
  buildTarget "$target"
elif [ "$1" = "x86_64" ]; then
  target="x86_64"
  buildTarget "$target"
elif [ "$1" = "web" ]; then
  cd $PROJECT_DIR
  yarn install
  yarn build:pkg
  cd $PROJECT_DIR/apps/cc-agent-web
  yarn build
elif [ "$1" = "all" ]; then
  for target in $targets; do
      buildTarget "$target"
  done
else
  echo "[-] Not found target!!"
fi


