self:
{
  config,
  system,
  lib,
  ...
}:
let
  inherit (lib)
    mkEnableOption
    mkOption
    types
    literalExpression
    mkIf
    toString
    ;

  abaPackage = self.packages.${system}.default;
  cfg = config.services.actual-budget-api;
in
{
  options.services.actual-budget-api = {
    enable = mkEnableOption "";
    package = mkOption {
      type = types.package;
      default = abaPackage;
    };

    serverURL = mkOption {
      type = types.str;
      example = "https://your-actual-server";
      description = ''
        This is the URL of your running actual budget server.
      '';
    };

    listenHost = mkOption {
      type = types.str;
      example = "0.0.0.0";
      default = "127.0.0.1";
      description = ''
        Api server listen host.
      '';
    };

    listenPort = mkOption {
      type = types.number;
      example = 31002;
      default = 31001;
      description = ''
        Api server listen port.
      '';
    };

    caCert = mkOption {
      type = types.path;
      default = config.security.pki.caBundle;
      example = literalExpression ''
        config.security.pki.caBundle
      '';
      description = ''
        File to set NODE_EXTRA_CA_CERTS.
      '';
    };
  };

  config = mkIf cfg.enable {
    systemd.services.actual-budget-api = {
      description = "Actual Budget API";
      wantedBy = [ "multi-user.target" ];
      after = [ "network-online.target" ];

      serviceConfig = {
        DynamicUser = true;
        ExecStart = "${cfg.package}/bin/actual-budget-api";
        RestartSec = 2;
        CacheDirectory = "actual-budget-api";
        WorkingDirectory = "/var/cache/actual-budget-api";
      };
      environment = {
        NODE_EXTRA_CA_CERTS = cfg.caCert;
        ACTUAL_API_SERVER_URL = cfg.serverURL;
        ACTUAL_API_PORT = toString cfg.listenPort;
        ACTUAL_API_LISTEN_ADDR = cfg.listenHost;
        ACTUAL_API_DATA_DIR = "/var/cache/actual-budget-api";
      };
    };
  };
}
