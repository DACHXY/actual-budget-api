{
  description = "Flake utils demo";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages = rec {
          actual-budget-api = pkgs.callPackage ./nix/package.nix { };
          default = actual-budget-api;
        };
        devShells = rec {
          actual-budget-api = pkgs.callPackage ./nix/shell.nix { };
          default = actual-budget-api;
        };
      }
    );
}
