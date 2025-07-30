{
  description = "Flake utils demo";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        packages = rec {
          actual-budget-api = pkgs.callPackage ./nix/package.nix { };
          default = actual-budget-api;
        };

        apps = rec {
          actual-budget-api = flake-utils.lib.mkApp { drv = self.packages.${system}.default; };
          default = actual-budget-api;
        };

        devShells = rec {
          actual-budget-api = pkgs.callPackage ./nix/shell.nix { };
          default = actual-budget-api;
        };
      }
    )
    // {
      nixosModules = rec {
        actual-budget-api = import ./nix/nixosModule.nix self;
        default = actual-budget-api;
      };
    };
}
