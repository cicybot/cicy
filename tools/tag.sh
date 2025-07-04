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
PROJECT_DIR=$(dirname "${CUR_DIR}")
cd $PROJECT_DIR
export TAG=$1

if [ -z "$TAG" ]; then
  echo "TAG is empty. Please provide a valid value."
  exit 1 
else
  echo "TAG is set to $TAG"
fi

sed -i '' "s/VERSION: .*/VERSION: ${TAG}/" ${PROJECT_DIR}/.github/workflows/cd.yaml
grep 'VERSION:' "${PROJECT_DIR}/.github/workflows/cd.yaml"

sed -i '' "s/\"version\": \".*\"/\"version\": \"${TAG}\"/" "${PROJECT_DIR}/apps/desktop/package.json"
grep 'version' ${PROJECT_DIR}/apps/desktop/package.json
cd $PROJECT_DIR
git add . && git commit -m "add tag: v${TAG}"
git tag -a v$TAG -m "Release version v${TAG}" && git push origin v$TAG
git push origin main