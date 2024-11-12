{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_23
  ];

  shellHook = ''
    echo "Node.js version: $(node -v)"
  '';
}
