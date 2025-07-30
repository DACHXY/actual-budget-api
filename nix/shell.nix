{
  mkShell,
  nodejs,
  prefetch-npm-deps,
  ...

}:
mkShell {
  name = "actual-budget-api";
  packages = [
    nodejs
    prefetch-npm-deps
  ];
}
