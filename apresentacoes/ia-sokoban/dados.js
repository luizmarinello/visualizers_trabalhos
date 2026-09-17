// Gerado por main.py --dados. Nao editar a mao.
// trilha: 4 digitos por expansao (linha e coluna do agente,
// linha e coluna da caixa). expandidos = trilha.length / 4 - 1.
window.DADOS = {
  "mapa": [
    "#######",
    "#.....#",
    "#.#C..#",
    "#...#.#",
    "#@...x#",
    "#######"
  ],
  "solucao": [
    "CIMA",
    "CIMA",
    "CIMA",
    "DIREITA",
    "DIREITA",
    "BAIXO",
    "BAIXO",
    "ESQUERDA",
    "BAIXO",
    "DIREITA",
    "DIREITA"
  ],
  "resultados": {
    "instancia1": {
      "ucs": {
        "status": "ok",
        "custo": 11,
        "passos": 11,
        "expandidos": 73,
        "gerados": 86,
        "podados": 1,
        "tempo": 0.0
      },
      "gulosa": {
        "status": "ok",
        "custo": 11,
        "passos": 11,
        "expandidos": 20,
        "gerados": 33,
        "podados": 0,
        "tempo": 0.0
      },
      "estrela": {
        "status": "ok",
        "custo": 11,
        "passos": 11,
        "expandidos": 38,
        "gerados": 55,
        "podados": 0,
        "tempo": 0.0
      }
    },
    "instancia2": {
      "ucs": {
        "status": "ok",
        "custo": 16,
        "passos": 16,
        "expandidos": 12606,
        "gerados": 17265,
        "podados": 113,
        "tempo": 0.058
      },
      "gulosa": {
        "status": "ok",
        "custo": 16,
        "passos": 16,
        "expandidos": 48,
        "gerados": 94,
        "podados": 0,
        "tempo": 0.0
      },
      "estrela": {
        "status": "ok",
        "custo": 16,
        "passos": 16,
        "expandidos": 2411,
        "gerados": 3637,
        "podados": 19,
        "tempo": 0.01
      }
    },
    "instancia3": {
      "ucs": {
        "status": "ok",
        "custo": 28,
        "passos": 28,
        "expandidos": 1532839,
        "gerados": 1620567,
        "podados": 10838,
        "tempo": 9.681
      },
      "gulosa": {
        "status": "ok",
        "custo": 40,
        "passos": 40,
        "expandidos": 364,
        "gerados": 595,
        "podados": 0,
        "tempo": 0.002
      },
      "estrela": {
        "status": "ok",
        "custo": 28,
        "passos": 28,
        "expandidos": 159631,
        "gerados": 225149,
        "podados": 1059,
        "tempo": 1.246
      }
    },
    "instancia4": {
      "ucs": {
        "status": "limite_nos",
        "custo": null,
        "passos": null,
        "expandidos": 2022849,
        "gerados": 3000000,
        "podados": 15855,
        "tempo": 16.516
      },
      "gulosa": {
        "status": "ok",
        "custo": 34,
        "passos": 34,
        "expandidos": 3647,
        "gerados": 4153,
        "podados": 50,
        "tempo": 0.037
      },
      "estrela": {
        "status": "ok",
        "custo": 26,
        "passos": 26,
        "expandidos": 74120,
        "gerados": 130955,
        "podados": 622,
        "tempo": 0.636
      }
    },
    "zero": {
      "ucs": {
        "status": "ok",
        "custo": 11,
        "passos": 11,
        "expandidos": 73,
        "gerados": 86,
        "podados": 1,
        "tempo": 0.0
      },
      "gulosa": {
        "status": "ok",
        "custo": 11,
        "passos": 11,
        "expandidos": 73,
        "gerados": 86,
        "podados": 1,
        "tempo": 0.0
      },
      "estrela": {
        "status": "ok",
        "custo": 11,
        "passos": 11,
        "expandidos": 73,
        "gerados": 86,
        "podados": 1,
        "tempo": 0.0
      }
    },
    "poda_com": {
      "ucs": {
        "status": "ok",
        "custo": 16,
        "passos": 16,
        "expandidos": 12606,
        "gerados": 17265,
        "podados": 113,
        "tempo": 0.046
      },
      "gulosa": {
        "status": "ok",
        "custo": 16,
        "passos": 16,
        "expandidos": 48,
        "gerados": 94,
        "podados": 0,
        "tempo": 0.0
      },
      "estrela": {
        "status": "ok",
        "custo": 16,
        "passos": 16,
        "expandidos": 2411,
        "gerados": 3637,
        "podados": 19,
        "tempo": 0.012
      }
    },
    "poda_sem": {
      "ucs": {
        "status": "ok",
        "custo": 16,
        "passos": 16,
        "expandidos": 12965,
        "gerados": 17874,
        "podados": 0,
        "tempo": 0.04
      },
      "gulosa": {
        "status": "ok",
        "custo": 16,
        "passos": 16,
        "expandidos": 48,
        "gerados": 94,
        "podados": 0,
        "tempo": 0.0
      },
      "estrela": {
        "status": "ok",
        "custo": 16,
        "passos": 16,
        "expandidos": 2428,
        "gerados": 3681,
        "podados": 0,
        "tempo": 0.011
      }
    },
    "custos": {
      "ucs": {
        "status": "ok",
        "custo": 22,
        "passos": 16,
        "expandidos": 15617,
        "gerados": 19390,
        "podados": 106,
        "tempo": 0.048
      },
      "gulosa": {
        "status": "ok",
        "custo": 22,
        "passos": 16,
        "expandidos": 48,
        "gerados": 94,
        "podados": 0,
        "tempo": 0.0
      },
      "estrela": {
        "status": "ok",
        "custo": 22,
        "passos": 16,
        "expandidos": 1401,
        "gerados": 1953,
        "podados": 6,
        "tempo": 0.007
      }
    }
  },
  "trilhas": {
    "ucs": "41233123422321233223432311233323442312232313452313233313241335232333142343133213141325132523133333432433242315234213441331131312151335131233143323433243253341134513211323121412113315331343244342433143353311133312241215122133124314432543414343442143453312134312321225123133114315433543334442444445",
    "gulosa": "412331234223212332234323112333234423122345231323233333432343324313432443424343444445",
    "estrela": "412331234223212332234323112333234423122345232313132335232333334333132413142325231333243323433243431332131413251324231523123314332533134324434243314343444445"
  }
};
