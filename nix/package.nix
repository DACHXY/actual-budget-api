{
  buildNpmPackage,
  ...
}:
buildNpmPackage rec {
  version = "1.0.0";
  pname = "actual-budget-api";
  name = "${pname}-${version}";

  src = ../.;

  npmDepsHash = "sha256-xcnYIgc/L94HAUaQvMVm/l+Hm+EFofRpOa6wqvsfNLM=";

  npmBuildScript = "build";
}
