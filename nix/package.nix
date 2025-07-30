{
  buildNpmPackage,
  ...
}:
buildNpmPackage rec {
  version = "1.0.0";
  pname = "actual-budget-api";
  name = "${pname}-${version}";

  src = ../.;

  npmDepsHash = "sha256-okXn2/vOJ2UJ3X0E3IXBrrnu1MtfGb/YpeWjm9rC7Sc=";

  npmBuildScript = "build";
}
