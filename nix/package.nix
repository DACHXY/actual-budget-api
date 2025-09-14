{
  buildNpmPackage,
  ...
}:
buildNpmPackage rec {
  version = "1.1.0";
  pname = "actual-budget-api";
  name = "${pname}-${version}";

  src = ../.;

  npmDepsHash = "sha256-qBkwMRUbDt8pooCixrIxcpvao87sw76MQ0zETtJEZSc=";

  npmBuildScript = "build";
}
