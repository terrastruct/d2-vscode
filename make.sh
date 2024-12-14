#!/bin/sh
set -eu
if [ \( -z "${CI_MAKE_ROOT-}" -a -n "${CI-}" \) -o ! -e "$(dirname "$0")/ci/sub/.git" ]; then
  set -x
  git submodule update --init
  set +x
fi
. "$(dirname "$0")/ci/sub/lib.sh"
PATH="$(cd -- "$(dirname "$0")" && pwd)/ci/sub/bin:$PATH"
cd "$(dirname "$0")"

lint() {
  sh_c hide xargsd "'\.\(ts\|tsx\|scss\|css\)$'" npx eslint@9.14.0
}

ensure_changed_files
job_parseflags "$@"
runjob fmt ./ci/sub/bin/fmt.sh &
if <"$CHANGED_FILES" grep -q '\.\(ts\|tsx\|scss\|css\)$'; then
  runjob lint &
fi
runjob build 'yarn package' &
ci_waitjobs
