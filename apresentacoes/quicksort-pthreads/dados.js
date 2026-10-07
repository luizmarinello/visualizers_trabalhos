/* dados.js - GERADO a partir de resultados/resumo.csv e resultados/maquina.txt
   do projeto QuickSort_pthreads (python3 analisar.py). Nao editar a mao:
   se os testes forem refeitos, gere de novo. Tempos em milissegundos. */
window.DADOS_QS = {
 "maquina": {
  "cpu": "Intel(R) Xeon(R) Processor @ 2.10GHz",
  "cpus": 2,
  "sistema": "Linux 6.18.44-fc-v77 x86_64",
  "compilador": "gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0",
  "repeticoes": 10
 },
 "entradas": {
  "pequena": {
   "n": 20000,
   "configs": [
    {
     "config": "seq",
     "media_ms": 1.2913,
     "desvio_ms": 0.0434,
     "min_ms": 1.2434,
     "max_ms": 1.3719,
     "speedup": 1.0,
     "eficiencia": 1.0,
     "threads": 1
    },
    {
     "config": "2",
     "media_ms": 1.0714,
     "desvio_ms": 0.0275,
     "min_ms": 1.031,
     "max_ms": 1.1254,
     "speedup": 1.2052,
     "eficiencia": 0.6026,
     "threads": 2
    },
    {
     "config": "4",
     "media_ms": 1.1821,
     "desvio_ms": 0.1037,
     "min_ms": 1.0896,
     "max_ms": 1.4431,
     "speedup": 1.0924,
     "eficiencia": 0.2731,
     "threads": 4
    },
    {
     "config": "8",
     "media_ms": 1.2199,
     "desvio_ms": 0.1721,
     "min_ms": 1.0102,
     "max_ms": 1.5331,
     "speedup": 1.0585,
     "eficiencia": 0.1323,
     "threads": 8
    },
    {
     "config": "max",
     "media_ms": 1.044,
     "desvio_ms": 0.0321,
     "min_ms": 1.0051,
     "max_ms": 1.0939,
     "speedup": 1.2368,
     "eficiencia": 0.6184,
     "threads": 2
    }
   ]
  },
  "media": {
   "n": 120000,
   "configs": [
    {
     "config": "seq",
     "media_ms": 8.9194,
     "desvio_ms": 0.2601,
     "min_ms": 8.6906,
     "max_ms": 9.5733,
     "speedup": 1.0,
     "eficiencia": 1.0,
     "threads": 1
    },
    {
     "config": "2",
     "media_ms": 6.0968,
     "desvio_ms": 1.0663,
     "min_ms": 5.6127,
     "max_ms": 9.1105,
     "speedup": 1.463,
     "eficiencia": 0.7315,
     "threads": 2
    },
    {
     "config": "4",
     "media_ms": 5.8089,
     "desvio_ms": 0.1515,
     "min_ms": 5.6913,
     "max_ms": 6.0681,
     "speedup": 1.5355,
     "eficiencia": 0.3839,
     "threads": 4
    },
    {
     "config": "8",
     "media_ms": 5.7749,
     "desvio_ms": 0.2287,
     "min_ms": 5.4214,
     "max_ms": 6.1353,
     "speedup": 1.5445,
     "eficiencia": 0.1931,
     "threads": 8
    },
    {
     "config": "max",
     "media_ms": 5.9211,
     "desvio_ms": 0.4508,
     "min_ms": 5.6615,
     "max_ms": 7.1866,
     "speedup": 1.5064,
     "eficiencia": 0.7532,
     "threads": 2
    }
   ]
  },
  "grande": {
   "n": 400000,
   "configs": [
    {
     "config": "seq",
     "media_ms": 32.8518,
     "desvio_ms": 0.4999,
     "min_ms": 32.3106,
     "max_ms": 33.6506,
     "speedup": 1.0,
     "eficiencia": 1.0,
     "threads": 1
    },
    {
     "config": "2",
     "media_ms": 18.0139,
     "desvio_ms": 0.407,
     "min_ms": 17.5232,
     "max_ms": 18.5906,
     "speedup": 1.8237,
     "eficiencia": 0.9118,
     "threads": 2
    },
    {
     "config": "4",
     "media_ms": 18.8122,
     "desvio_ms": 1.5061,
     "min_ms": 17.6426,
     "max_ms": 21.8268,
     "speedup": 1.7463,
     "eficiencia": 0.4366,
     "threads": 4
    },
    {
     "config": "8",
     "media_ms": 20.3618,
     "desvio_ms": 1.0834,
     "min_ms": 18.4476,
     "max_ms": 22.5143,
     "speedup": 1.6134,
     "eficiencia": 0.2017,
     "threads": 8
    },
    {
     "config": "max",
     "media_ms": 18.3169,
     "desvio_ms": 0.8452,
     "min_ms": 17.5272,
     "max_ms": 19.901,
     "speedup": 1.7935,
     "eficiencia": 0.8968,
     "threads": 2
    }
   ]
  }
 }
};
