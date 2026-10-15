/**
 * Mock Data del Corredor Panamericana Sur (PE-1S)
 */

import { CrashPoint, SeverityLevel, CrashType } from './pkg/lrs/types.js';

export const MOCK_ALIGNMENT_DATA = {
  "id": "EJEMPLO",
  "name": "Ruta de Ejemplo: Panamericana",
  "totalLength": 24769.83,
  "vertices": [
    {
      "index": 0,
      "coordinates": {
        "longitude": -76.976926,
        "latitude": -12.217337
      },
      "cumulativeDistance": 0.0,
      "stationFormatted": "km 0+000.00"
    },
    {
      "index": 1,
      "coordinates": {
        "longitude": -76.972565,
        "latitude": -12.1934
      },
      "cumulativeDistance": 2703.55,
      "stationFormatted": "km 2+703.55"
    },
    {
      "index": 2,
      "coordinates": {
        "longitude": -76.973034,
        "latitude": -12.190041
      },
      "cumulativeDistance": 3080.51,
      "stationFormatted": "km 3+080.51"
    },
    {
      "index": 3,
      "coordinates": {
        "longitude": -76.975464,
        "latitude": -12.182705
      },
      "cumulativeDistance": 3937.93,
      "stationFormatted": "km 3+937.93"
    },
    {
      "index": 4,
      "coordinates": {
        "longitude": -76.982077,
        "latitude": -12.16091
      },
      "cumulativeDistance": 6465.78,
      "stationFormatted": "km 6+465.78"
    },
    {
      "index": 5,
      "coordinates": {
        "longitude": -76.983571,
        "latitude": -12.155341
      },
      "cumulativeDistance": 7105.97,
      "stationFormatted": "km 7+105.97"
    },
    {
      "index": 6,
      "coordinates": {
        "longitude": -76.983861,
        "latitude": -12.151644
      },
      "cumulativeDistance": 7518.26,
      "stationFormatted": "km 7+518.26"
    },
    {
      "index": 7,
      "coordinates": {
        "longitude": -76.982531,
        "latitude": -12.147232
      },
      "cumulativeDistance": 8029.71,
      "stationFormatted": "km 8+029.71"
    },
    {
      "index": 8,
      "coordinates": {
        "longitude": -76.981459,
        "latitude": -12.142202
      },
      "cumulativeDistance": 8601.04,
      "stationFormatted": "km 8+601.04"
    },
    {
      "index": 9,
      "coordinates": {
        "longitude": -76.980364,
        "latitude": -12.137228
      },
      "cumulativeDistance": 9166.78,
      "stationFormatted": "km 9+166.78"
    },
    {
      "index": 10,
      "coordinates": {
        "longitude": -76.978941,
        "latitude": -12.133567
      },
      "cumulativeDistance": 9602.27,
      "stationFormatted": "km 9+602.27"
    },
    {
      "index": 11,
      "coordinates": {
        "longitude": -76.977193,
        "latitude": -12.128358
      },
      "cumulativeDistance": 10211.86,
      "stationFormatted": "km 10+211.86"
    },
    {
      "index": 12,
      "coordinates": {
        "longitude": -76.976959,
        "latitude": -12.124784
      },
      "cumulativeDistance": 10610.09,
      "stationFormatted": "km 10+610.09"
    },
    {
      "index": 13,
      "coordinates": {
        "longitude": -76.977454,
        "latitude": -12.116034
      },
      "cumulativeDistance": 11584.53,
      "stationFormatted": "km 11+584.53"
    },
    {
      "index": 14,
      "coordinates": {
        "longitude": -76.978783,
        "latitude": -12.106113
      },
      "cumulativeDistance": 12697.12,
      "stationFormatted": "km 12+697.12"
    },
    {
      "index": 15,
      "coordinates": {
        "longitude": -76.980011,
        "latitude": -12.097034
      },
      "cumulativeDistance": 13715.45,
      "stationFormatted": "km 13+715.45"
    },
    {
      "index": 16,
      "coordinates": {
        "longitude": -76.981106,
        "latitude": -12.088132
      },
      "cumulativeDistance": 14712.44,
      "stationFormatted": "km 14+712.44"
    },
    {
      "index": 17,
      "coordinates": {
        "longitude": -76.98215,
        "latitude": -12.086014
      },
      "cumulativeDistance": 14973.88,
      "stationFormatted": "km 14+973.88"
    },
    {
      "index": 18,
      "coordinates": {
        "longitude": -76.982202,
        "latitude": -12.085325
      },
      "cumulativeDistance": 15050.7,
      "stationFormatted": "km 15+050.70"
    },
    {
      "index": 19,
      "coordinates": {
        "longitude": -76.981915,
        "latitude": -12.084407
      },
      "cumulativeDistance": 15157.45,
      "stationFormatted": "km 15+157.45"
    },
    {
      "index": 20,
      "coordinates": {
        "longitude": -76.978681,
        "latitude": -12.081604
      },
      "cumulativeDistance": 15627.33,
      "stationFormatted": "km 15+627.33"
    },
    {
      "index": 21,
      "coordinates": {
        "longitude": -76.97675,
        "latitude": -12.079487
      },
      "cumulativeDistance": 15942.76,
      "stationFormatted": "km 15+942.76"
    },
    {
      "index": 22,
      "coordinates": {
        "longitude": -76.975393,
        "latitude": -12.076706
      },
      "cumulativeDistance": 16285.4,
      "stationFormatted": "km 16+285.40"
    },
    {
      "index": 23,
      "coordinates": {
        "longitude": -76.972158,
        "latitude": -12.068772
      },
      "cumulativeDistance": 17235.16,
      "stationFormatted": "km 17+235.16"
    },
    {
      "index": 24,
      "coordinates": {
        "longitude": -76.971349,
        "latitude": -12.065813
      },
      "cumulativeDistance": 17575.74,
      "stationFormatted": "km 17+575.74"
    },
    {
      "index": 25,
      "coordinates": {
        "longitude": -76.971427,
        "latitude": -12.063288
      },
      "cumulativeDistance": 17856.64,
      "stationFormatted": "km 17+856.64"
    },
    {
      "index": 26,
      "coordinates": {
        "longitude": -76.972028,
        "latitude": -12.06145
      },
      "cumulativeDistance": 18071.21,
      "stationFormatted": "km 18+071.21"
    },
    {
      "index": 27,
      "coordinates": {
        "longitude": -76.973723,
        "latitude": -12.057751
      },
      "cumulativeDistance": 18521.93,
      "stationFormatted": "km 18+521.93"
    },
    {
      "index": 28,
      "coordinates": {
        "longitude": -76.975628,
        "latitude": -12.052946
      },
      "cumulativeDistance": 19094.98,
      "stationFormatted": "km 19+094.98"
    },
    {
      "index": 29,
      "coordinates": {
        "longitude": -76.97688,
        "latitude": -12.05116
      },
      "cumulativeDistance": 19335.76,
      "stationFormatted": "km 19+335.76"
    },
    {
      "index": 30,
      "coordinates": {
        "longitude": -76.97868,
        "latitude": -12.0494
      },
      "cumulativeDistance": 19612.55,
      "stationFormatted": "km 19+612.55"
    },
    {
      "index": 31,
      "coordinates": {
        "longitude": -76.985515,
        "latitude": -12.04348
      },
      "cumulativeDistance": 20605.42,
      "stationFormatted": "km 20+605.42"
    },
    {
      "index": 32,
      "coordinates": {
        "longitude": -76.986702,
        "latitude": -12.042273
      },
      "cumulativeDistance": 20791.64,
      "stationFormatted": "km 20+791.64"
    },
    {
      "index": 33,
      "coordinates": {
        "longitude": -76.987885,
        "latitude": -12.040244
      },
      "cumulativeDistance": 21051.35,
      "stationFormatted": "km 21+051.35"
    },
    {
      "index": 34,
      "coordinates": {
        "longitude": -76.98876,
        "latitude": -12.036823
      },
      "cumulativeDistance": 21443.47,
      "stationFormatted": "km 21+443.47"
    },
    {
      "index": 35,
      "coordinates": {
        "longitude": -76.989691,
        "latitude": -12.034571
      },
      "cumulativeDistance": 21713.58,
      "stationFormatted": "km 21+713.58"
    },
    {
      "index": 36,
      "coordinates": {
        "longitude": -76.990894,
        "latitude": -12.032584
      },
      "cumulativeDistance": 21970.35,
      "stationFormatted": "km 21+970.35"
    },
    {
      "index": 37,
      "coordinates": {
        "longitude": -76.992977,
        "latitude": -12.030844
      },
      "cumulativeDistance": 22268.26,
      "stationFormatted": "km 22+268.26"
    },
    {
      "index": 38,
      "coordinates": {
        "longitude": -76.994992,
        "latitude": -12.029668
      },
      "cumulativeDistance": 22523.45,
      "stationFormatted": "km 22+523.45"
    },
    {
      "index": 39,
      "coordinates": {
        "longitude": -76.996212,
        "latitude": -12.029122
      },
      "cumulativeDistance": 22669.36,
      "stationFormatted": "km 22+669.36"
    },
    {
      "index": 40,
      "coordinates": {
        "longitude": -76.998075,
        "latitude": -12.029055
      },
      "cumulativeDistance": 22872.1,
      "stationFormatted": "km 22+872.10"
    },
    {
      "index": 41,
      "coordinates": {
        "longitude": -77.002071,
        "latitude": -12.030682
      },
      "cumulativeDistance": 23342.83,
      "stationFormatted": "km 23+342.83"
    },
    {
      "index": 42,
      "coordinates": {
        "longitude": -77.005289,
        "latitude": -12.031908
      },
      "cumulativeDistance": 23718.41,
      "stationFormatted": "km 23+718.41"
    },
    {
      "index": 43,
      "coordinates": {
        "longitude": -77.008203,
        "latitude": -12.033548
      },
      "cumulativeDistance": 24084.04,
      "stationFormatted": "km 24+084.04"
    },
    {
      "index": 44,
      "coordinates": {
        "longitude": -77.013094,
        "latitude": -12.037441
      },
      "cumulativeDistance": 24769.83,
      "stationFormatted": "km 24+769.83"
    }
  ],
  "coordinates": [
    [
      -76.976926,
      -12.217337
    ],
    [
      -76.972565,
      -12.1934
    ],
    [
      -76.973034,
      -12.190041
    ],
    [
      -76.975464,
      -12.182705
    ],
    [
      -76.982077,
      -12.16091
    ],
    [
      -76.983571,
      -12.155341
    ],
    [
      -76.983861,
      -12.151644
    ],
    [
      -76.982531,
      -12.147232
    ],
    [
      -76.981459,
      -12.142202
    ],
    [
      -76.980364,
      -12.137228
    ],
    [
      -76.978941,
      -12.133567
    ],
    [
      -76.977193,
      -12.128358
    ],
    [
      -76.976959,
      -12.124784
    ],
    [
      -76.977454,
      -12.116034
    ],
    [
      -76.978783,
      -12.106113
    ],
    [
      -76.980011,
      -12.097034
    ],
    [
      -76.981106,
      -12.088132
    ],
    [
      -76.98215,
      -12.086014
    ],
    [
      -76.982202,
      -12.085325
    ],
    [
      -76.981915,
      -12.084407
    ],
    [
      -76.978681,
      -12.081604
    ],
    [
      -76.97675,
      -12.079487
    ],
    [
      -76.975393,
      -12.076706
    ],
    [
      -76.972158,
      -12.068772
    ],
    [
      -76.971349,
      -12.065813
    ],
    [
      -76.971427,
      -12.063288
    ],
    [
      -76.972028,
      -12.06145
    ],
    [
      -76.973723,
      -12.057751
    ],
    [
      -76.975628,
      -12.052946
    ],
    [
      -76.97688,
      -12.05116
    ],
    [
      -76.97868,
      -12.0494
    ],
    [
      -76.985515,
      -12.04348
    ],
    [
      -76.986702,
      -12.042273
    ],
    [
      -76.987885,
      -12.040244
    ],
    [
      -76.98876,
      -12.036823
    ],
    [
      -76.989691,
      -12.034571
    ],
    [
      -76.990894,
      -12.032584
    ],
    [
      -76.992977,
      -12.030844
    ],
    [
      -76.994992,
      -12.029668
    ],
    [
      -76.996212,
      -12.029122
    ],
    [
      -76.998075,
      -12.029055
    ],
    [
      -77.002071,
      -12.030682
    ],
    [
      -77.005289,
      -12.031908
    ],
    [
      -77.008203,
      -12.033548
    ],
    [
      -77.013094,
      -12.037441
    ]
  ]
};

export const MOCK_CRASHES_DATA: CrashPoint[] = [
  {
    "id": "CRASH-2021-001",
    "coordinates": [
      -76.959215,
      -12.182002
    ],
    "year": 2021,
    "timestamp": "2021-07-02T00:05:00Z",
    "severity": "LESIONES_LEVES",
    "type": "VOLCADURA",
    "vehicles": [
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 238.44,
    "approxLateralOffsetM": -1.56
  },
  {
    "id": "CRASH-2021-002",
    "coordinates": [
      -76.936639,
      -12.228897
    ],
    "year": 2021,
    "timestamp": "2021-10-09T00:48:00Z",
    "severity": "LESIONES_LEVES",
    "type": "VOLCADURA",
    "vehicles": [
      "BUS_INTERPROVINCIAL",
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 6005.3,
    "approxLateralOffsetM": -14.4
  },
  {
    "id": "CRASH-2021-003",
    "coordinates": [
      -76.939185,
      -12.223152
    ],
    "year": 2021,
    "timestamp": "2021-07-04T11:54:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CHOQUE",
    "vehicles": [
      "AUTOMOVIL",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5310.11,
    "approxLateralOffsetM": -10.75
  },
  {
    "id": "CRASH-2021-004",
    "coordinates": [
      -76.944977,
      -12.211681
    ],
    "year": 2021,
    "timestamp": "2021-11-20T11:36:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CAIDA_PASAJERO",
    "vehicles": [
      "AUTOMOVIL",
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3885.24,
    "approxLateralOffsetM": -21.2
  },
  {
    "id": "CRASH-2021-005",
    "coordinates": [
      -76.954724,
      -12.192494
    ],
    "year": 2021,
    "timestamp": "2021-07-09T14:40:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CHOQUE",
    "vehicles": [
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1503.44,
    "approxLateralOffsetM": 2.86
  },
  {
    "id": "CRASH-2021-006",
    "coordinates": [
      -76.955697,
      -12.190673
    ],
    "year": 2021,
    "timestamp": "2021-11-06T17:46:00Z",
    "severity": "LESIONES_LEVES",
    "type": "VOLCADURA",
    "vehicles": [
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1275.51,
    "approxLateralOffsetM": -12.81
  },
  {
    "id": "CRASH-2021-007",
    "coordinates": [
      -76.944645,
      -12.212438
    ],
    "year": 2021,
    "timestamp": "2021-01-26T10:25:00Z",
    "severity": "LESIONES_LEVES",
    "type": "ATROPELLO",
    "vehicles": [
      "AUTOMOVIL",
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3976.3,
    "approxLateralOffsetM": -30.72
  },
  {
    "id": "CRASH-2021-008",
    "coordinates": [
      -76.95378,
      -12.194123
    ],
    "year": 2021,
    "timestamp": "2021-03-09T04:15:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOTAXI",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1711.17,
    "approxLateralOffsetM": 15.49
  },
  {
    "id": "CRASH-2021-009",
    "coordinates": [
      -76.943893,
      -12.213407
    ],
    "year": 2021,
    "timestamp": "2021-03-17T15:05:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "CAMION_CARGA",
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 4110.91,
    "approxLateralOffsetM": -9.4
  },
  {
    "id": "CRASH-2021-010",
    "coordinates": [
      -76.934095,
      -12.232996
    ],
    "year": 2021,
    "timestamp": "2021-09-09T17:55:00Z",
    "severity": "LESIONES_LEVES",
    "type": "ATROPELLO",
    "vehicles": [
      "MOTOTAXI",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 6537.95,
    "approxLateralOffsetM": 4.74
  },
  {
    "id": "CRASH-2021-011",
    "coordinates": [
      -76.939515,
      -12.221975
    ],
    "year": 2021,
    "timestamp": "2021-05-14T05:29:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "DESPISTE",
    "vehicles": [
      "CAMION_CARGA",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5175.57,
    "approxLateralOffsetM": 6.77
  },
  {
    "id": "CRASH-2021-012",
    "coordinates": [
      -76.936684,
      -12.228696
    ],
    "year": 2021,
    "timestamp": "2021-11-17T19:12:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5983.38,
    "approxLateralOffsetM": -7.7
  },
  {
    "id": "CRASH-2021-013",
    "coordinates": [
      -76.956094,
      -12.189587
    ],
    "year": 2021,
    "timestamp": "2021-02-12T09:15:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOTAXI",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1147.44,
    "approxLateralOffsetM": -5.95
  },
  {
    "id": "CRASH-2021-014",
    "coordinates": [
      -76.936742,
      -12.228487
    ],
    "year": 2021,
    "timestamp": "2021-11-16T17:10:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5959.98,
    "approxLateralOffsetM": -1.94
  },
  {
    "id": "CRASH-2021-015",
    "coordinates": [
      -76.937284,
      -12.227232
    ],
    "year": 2021,
    "timestamp": "2021-07-22T20:23:00Z",
    "severity": "LESIONES_LEVES",
    "type": "VOLCADURA",
    "vehicles": [
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5808.35,
    "approxLateralOffsetM": 4.49
  },
  {
    "id": "CRASH-2021-016",
    "coordinates": [
      -76.937354,
      -12.227101
    ],
    "year": 2021,
    "timestamp": "2021-04-01T02:45:00Z",
    "severity": "FATAL",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5791.99,
    "approxLateralOffsetM": 3.17
  },
  {
    "id": "CRASH-2021-017",
    "coordinates": [
      -76.95346,
      -12.194609
    ],
    "year": 2021,
    "timestamp": "2021-12-19T18:30:00Z",
    "severity": "FATAL",
    "type": "CHOQUE",
    "vehicles": [
      "BUS_INTERPROVINCIAL",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1774.95,
    "approxLateralOffsetM": 22.99
  },
  {
    "id": "CRASH-2021-018",
    "coordinates": [
      -76.94591,
      -12.209598
    ],
    "year": 2021,
    "timestamp": "2021-12-02T21:41:00Z",
    "severity": "FATAL",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOTAXI",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3633.57,
    "approxLateralOffsetM": 3.22
  },
  {
    "id": "CRASH-2021-019",
    "coordinates": [
      -76.957381,
      -12.186643
    ],
    "year": 2021,
    "timestamp": "2021-04-07T17:28:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 791.53,
    "approxLateralOffsetM": -8.51
  },
  {
    "id": "CRASH-2021-020",
    "coordinates": [
      -76.955129,
      -12.191456
    ],
    "year": 2021,
    "timestamp": "2021-11-18T00:05:00Z",
    "severity": "SOLO_DANOS",
    "type": "CHOQUE",
    "vehicles": [
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1379.71,
    "approxLateralOffsetM": 10.44
  },
  {
    "id": "CRASH-2021-021",
    "coordinates": [
      -76.934488,
      -12.232247
    ],
    "year": 2021,
    "timestamp": "2021-07-01T12:16:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CHOQUE",
    "vehicles": [
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 6444.47,
    "approxLateralOffsetM": 8.1
  },
  {
    "id": "CRASH-2022-022",
    "coordinates": [
      -76.93659,
      -12.228461
    ],
    "year": 2022,
    "timestamp": "2022-05-07T01:37:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "VOLCADURA",
    "vehicles": [
      "BUS_INTERPROVINCIAL",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5965.53,
    "approxLateralOffsetM": 13.96
  },
  {
    "id": "CRASH-2022-023",
    "coordinates": [
      -76.958309,
      -12.184271
    ],
    "year": 2022,
    "timestamp": "2022-09-03T05:04:00Z",
    "severity": "LESIONES_LEVES",
    "type": "DESPISTE",
    "vehicles": [
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 509.28,
    "approxLateralOffsetM": -1.75
  },
  {
    "id": "CRASH-2022-024",
    "coordinates": [
      -76.939673,
      -12.221667
    ],
    "year": 2022,
    "timestamp": "2022-10-02T19:05:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5137.37,
    "approxLateralOffsetM": 4.14
  },
  {
    "id": "CRASH-2022-025",
    "coordinates": [
      -76.937465,
      -12.227029
    ],
    "year": 2022,
    "timestamp": "2022-07-05T21:41:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "VOLCADURA",
    "vehicles": [
      "BUS_INTERPROVINCIAL",
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5780.01,
    "approxLateralOffsetM": -4.87
  },
  {
    "id": "CRASH-2022-026",
    "coordinates": [
      -76.943907,
      -12.213476
    ],
    "year": 2022,
    "timestamp": "2022-09-07T16:16:00Z",
    "severity": "FATAL",
    "type": "ATROPELLO",
    "vehicles": [
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 4117.07,
    "approxLateralOffsetM": -14.15
  },
  {
    "id": "CRASH-2022-027",
    "coordinates": [
      -76.944333,
      -12.212779
    ],
    "year": 2022,
    "timestamp": "2022-11-27T17:19:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOCICLETA",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 4025.99,
    "approxLateralOffsetM": -19.59
  },
  {
    "id": "CRASH-2022-028",
    "coordinates": [
      -76.957103,
      -12.186909
    ],
    "year": 2022,
    "timestamp": "2022-05-20T06:45:00Z",
    "severity": "SOLO_DANOS",
    "type": "VOLCADURA",
    "vehicles": [
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 830.47,
    "approxLateralOffsetM": 7.91
  },
  {
    "id": "CRASH-2022-029",
    "coordinates": [
      -76.937348,
      -12.227357
    ],
    "year": 2022,
    "timestamp": "2022-11-14T08:02:00Z",
    "severity": "LESIONES_LEVES",
    "type": "DESPISTE",
    "vehicles": [
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5818.52,
    "approxLateralOffsetM": -7.29
  },
  {
    "id": "CRASH-2022-030",
    "coordinates": [
      -76.955517,
      -12.190958
    ],
    "year": 2022,
    "timestamp": "2022-02-03T22:57:00Z",
    "severity": "LESIONES_LEVES",
    "type": "ATROPELLO",
    "vehicles": [
      "MOTOCICLETA",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1312.28,
    "approxLateralOffsetM": -7.11
  },
  {
    "id": "CRASH-2022-031",
    "coordinates": [
      -76.955381,
      -12.190893
    ],
    "year": 2022,
    "timestamp": "2022-06-07T21:15:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CHOQUE",
    "vehicles": [
      "CAMION_CARGA",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1311.28,
    "approxLateralOffsetM": 9.38
  },
  {
    "id": "CRASH-2022-032",
    "coordinates": [
      -76.949985,
      -12.202356
    ],
    "year": 2022,
    "timestamp": "2022-03-26T05:56:00Z",
    "severity": "LESIONES_LEVES",
    "type": "DESPISTE",
    "vehicles": [
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 2714.78,
    "approxLateralOffsetM": -15.95
  },
  {
    "id": "CRASH-2022-033",
    "coordinates": [
      -76.955292,
      -12.19161
    ],
    "year": 2022,
    "timestamp": "2022-03-26T22:06:00Z",
    "severity": "SOLO_DANOS",
    "type": "DESPISTE",
    "vehicles": [
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1388.63,
    "approxLateralOffsetM": -12.54
  },
  {
    "id": "CRASH-2022-034",
    "coordinates": [
      -76.954958,
      -12.192242
    ],
    "year": 2022,
    "timestamp": "2022-01-22T06:25:00Z",
    "severity": "SOLO_DANOS",
    "type": "ATROPELLO",
    "vehicles": [
      "BUS_INTERPROVINCIAL",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1467.1,
    "approxLateralOffsetM": -7.71
  },
  {
    "id": "CRASH-2022-035",
    "coordinates": [
      -76.954705,
      -12.192638
    ],
    "year": 2022,
    "timestamp": "2022-05-06T18:16:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "AUTOMOVIL",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1518.74,
    "approxLateralOffsetM": -2.34
  },
  {
    "id": "CRASH-2022-036",
    "coordinates": [
      -76.937709,
      -12.226134
    ],
    "year": 2022,
    "timestamp": "2022-10-07T08:02:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "ATROPELLO",
    "vehicles": [
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5677.95,
    "approxLateralOffsetM": 9.04
  },
  {
    "id": "CRASH-2022-037",
    "coordinates": [
      -76.959657,
      -12.180475
    ],
    "year": 2022,
    "timestamp": "2022-07-03T21:58:00Z",
    "severity": "LESIONES_LEVES",
    "type": "VOLCADURA",
    "vehicles": [
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 62.74,
    "approxLateralOffsetM": 15.54
  },
  {
    "id": "CRASH-2022-038",
    "coordinates": [
      -76.945597,
      -12.210275
    ],
    "year": 2022,
    "timestamp": "2022-12-10T17:08:00Z",
    "severity": "SOLO_DANOS",
    "type": "ATROPELLO",
    "vehicles": [
      "CAMION_CARGA",
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3715.92,
    "approxLateralOffsetM": -3.74
  },
  {
    "id": "CRASH-2022-039",
    "coordinates": [
      -76.937066,
      -12.22739
    ],
    "year": 2022,
    "timestamp": "2022-05-10T06:27:00Z",
    "severity": "SOLO_DANOS",
    "type": "ATROPELLO",
    "vehicles": [
      "MOTOTAXI",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5833.79,
    "approxLateralOffsetM": 19.6
  },
  {
    "id": "CRASH-2022-040",
    "coordinates": [
      -76.941818,
      -12.217521
    ],
    "year": 2022,
    "timestamp": "2022-08-26T23:10:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 4620.87,
    "approxLateralOffsetM": -7.71
  },
  {
    "id": "CRASH-2022-041",
    "coordinates": [
      -76.952064,
      -12.198078
    ],
    "year": 2022,
    "timestamp": "2022-04-26T06:09:00Z",
    "severity": "FATAL",
    "type": "CAIDA_PASAJERO",
    "vehicles": [
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 2188.18,
    "approxLateralOffsetM": -10.02
  },
  {
    "id": "CRASH-2022-042",
    "coordinates": [
      -76.955618,
      -12.190113
    ],
    "year": 2022,
    "timestamp": "2022-08-13T07:09:00Z",
    "severity": "SOLO_DANOS",
    "type": "ATROPELLO",
    "vehicles": [
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1221.34,
    "approxLateralOffsetM": 19.15
  },
  {
    "id": "CRASH-2023-043",
    "coordinates": [
      -76.959709,
      -12.180775
    ],
    "year": 2023,
    "timestamp": "2023-04-06T22:33:00Z",
    "severity": "SOLO_DANOS",
    "type": "VOLCADURA",
    "vehicles": [
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 91.78,
    "approxLateralOffsetM": -1.94
  },
  {
    "id": "CRASH-2023-044",
    "coordinates": [
      -76.936771,
      -12.2279
    ],
    "year": 2023,
    "timestamp": "2023-09-15T05:47:00Z",
    "severity": "LESIONES_LEVES",
    "type": "DESPISTE",
    "vehicles": [
      "MOTOTAXI",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5901.47,
    "approxLateralOffsetM": 27.19
  },
  {
    "id": "CRASH-2023-045",
    "coordinates": [
      -76.946798,
      -12.208099
    ],
    "year": 2023,
    "timestamp": "2023-08-03T22:18:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "VOLCADURA",
    "vehicles": [
      "BUS_INTERPROVINCIAL",
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3441.04,
    "approxLateralOffsetM": 0.3
  },
  {
    "id": "CRASH-2023-046",
    "coordinates": [
      -76.946537,
      -12.208697
    ],
    "year": 2023,
    "timestamp": "2023-02-14T13:21:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CHOQUE",
    "vehicles": [
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3512.92,
    "approxLateralOffsetM": -7.4
  },
  {
    "id": "CRASH-2023-047",
    "coordinates": [
      -76.947832,
      -12.206002
    ],
    "year": 2023,
    "timestamp": "2023-07-16T00:22:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3182.64,
    "approxLateralOffsetM": 15.8
  },
  {
    "id": "CRASH-2023-048",
    "coordinates": [
      -76.944403,
      -12.212805
    ],
    "year": 2023,
    "timestamp": "2023-04-09T13:31:00Z",
    "severity": "LESIONES_LEVES",
    "type": "VOLCADURA",
    "vehicles": [
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 4024.82,
    "approxLateralOffsetM": -27.6
  },
  {
    "id": "CRASH-2023-049",
    "coordinates": [
      -76.945953,
      -12.209986
    ],
    "year": 2023,
    "timestamp": "2023-09-01T12:37:00Z",
    "severity": "LESIONES_LEVES",
    "type": "DESPISTE",
    "vehicles": [
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3669.06,
    "approxLateralOffsetM": -21.86
  },
  {
    "id": "CRASH-2023-050",
    "coordinates": [
      -76.959189,
      -12.182145
    ],
    "year": 2023,
    "timestamp": "2023-08-11T10:48:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "CAMION_CARGA",
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 254.2,
    "approxLateralOffsetM": -4.72
  },
  {
    "id": "CRASH-2023-051",
    "coordinates": [
      -76.952198,
      -12.197725
    ],
    "year": 2023,
    "timestamp": "2023-01-24T17:03:00Z",
    "severity": "SOLO_DANOS",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 2146.51,
    "approxLateralOffsetM": -5.91
  },
  {
    "id": "CRASH-2023-052",
    "coordinates": [
      -76.950085,
      -12.202123
    ],
    "year": 2023,
    "timestamp": "2023-01-20T04:15:00Z",
    "severity": "LESIONES_LEVES",
    "type": "VOLCADURA",
    "vehicles": [
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 2686.76,
    "approxLateralOffsetM": -14.33
  },
  {
    "id": "CRASH-2023-053",
    "coordinates": [
      -76.937532,
      -12.226163
    ],
    "year": 2023,
    "timestamp": "2023-03-10T03:37:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "BUS_INTERPROVINCIAL",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5688.29,
    "approxLateralOffsetM": 25.6
  },
  {
    "id": "CRASH-2023-054",
    "coordinates": [
      -76.944331,
      -12.212922
    ],
    "year": 2023,
    "timestamp": "2023-10-23T20:15:00Z",
    "severity": "LESIONES_LEVES",
    "type": "DESPISTE",
    "vehicles": [
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 4039.97,
    "approxLateralOffsetM": -27.18
  },
  {
    "id": "CRASH-2023-055",
    "coordinates": [
      -76.945774,
      -12.20969
    ],
    "year": 2023,
    "timestamp": "2023-09-14T21:23:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CAIDA_PASAJERO",
    "vehicles": [
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3649.77,
    "approxLateralOffsetM": 11.17
  },
  {
    "id": "CRASH-2023-056",
    "coordinates": [
      -76.937706,
      -12.226697
    ],
    "year": 2023,
    "timestamp": "2023-07-06T23:33:00Z",
    "severity": "SOLO_DANOS",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOTAXI",
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5735.85,
    "approxLateralOffsetM": -14.78
  },
  {
    "id": "CRASH-2023-057",
    "coordinates": [
      -76.952209,
      -12.197114
    ],
    "year": 2023,
    "timestamp": "2023-12-19T08:20:00Z",
    "severity": "SOLO_DANOS",
    "type": "ATROPELLO",
    "vehicles": [
      "MOTOTAXI",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 2084.93,
    "approxLateralOffsetM": 22.89
  },
  {
    "id": "CRASH-2023-058",
    "coordinates": [
      -76.934961,
      -12.231111
    ],
    "year": 2023,
    "timestamp": "2023-08-28T10:11:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "ATROPELLO",
    "vehicles": [
      "CAMION_CARGA",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 6309.11,
    "approxLateralOffsetM": 24.74
  },
  {
    "id": "CRASH-2023-059",
    "coordinates": [
      -76.944439,
      -12.212162
    ],
    "year": 2023,
    "timestamp": "2023-09-07T02:15:00Z",
    "severity": "SOLO_DANOS",
    "type": "VOLCADURA",
    "vehicles": [
      "MOTOCICLETA",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3960.52,
    "approxLateralOffsetM": 3.78
  },
  {
    "id": "CRASH-2023-060",
    "coordinates": [
      -76.945596,
      -12.210432
    ],
    "year": 2023,
    "timestamp": "2023-02-10T07:25:00Z",
    "severity": "SOLO_DANOS",
    "type": "VOLCADURA",
    "vehicles": [
      "MOTOTAXI",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3731.17,
    "approxLateralOffsetM": -12.2
  },
  {
    "id": "CRASH-2023-061",
    "coordinates": [
      -76.951413,
      -12.199458
    ],
    "year": 2023,
    "timestamp": "2023-05-10T08:14:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "CAMION_CARGA",
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 2357.1,
    "approxLateralOffsetM": -13.82
  },
  {
    "id": "CRASH-2023-062",
    "coordinates": [
      -76.95552,
      -12.191002
    ],
    "year": 2023,
    "timestamp": "2023-12-16T08:46:00Z",
    "severity": "SOLO_DANOS",
    "type": "VOLCADURA",
    "vehicles": [
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1316.73,
    "approxLateralOffsetM": -9.24
  },
  {
    "id": "CRASH-2023-063",
    "coordinates": [
      -76.937252,
      -12.22692
    ],
    "year": 2023,
    "timestamp": "2023-04-12T05:19:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CAIDA_PASAJERO",
    "vehicles": [
      "CAMION_CARGA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5777.76,
    "approxLateralOffsetM": 21.14
  },
  {
    "id": "CRASH-2024-064",
    "coordinates": [
      -76.936827,
      -12.228246
    ],
    "year": 2024,
    "timestamp": "2024-02-28T00:36:00Z",
    "severity": "FATAL",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5932.05,
    "approxLateralOffsetM": 3.05
  },
  {
    "id": "CRASH-2024-065",
    "coordinates": [
      -76.945563,
      -12.210204
    ],
    "year": 2024,
    "timestamp": "2024-07-16T02:36:00Z",
    "severity": "FATAL",
    "type": "DESPISTE",
    "vehicles": [
      "AUTOMOVIL",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3710.86,
    "approxLateralOffsetM": 3.27
  },
  {
    "id": "CRASH-2024-066",
    "coordinates": [
      -76.958388,
      -12.183767
    ],
    "year": 2024,
    "timestamp": "2024-07-20T19:50:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "CAIDA_PASAJERO",
    "vehicles": [
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 453.92,
    "approxLateralOffsetM": 10.66
  },
  {
    "id": "CRASH-2024-067",
    "coordinates": [
      -76.936893,
      -12.227911
    ],
    "year": 2024,
    "timestamp": "2024-05-19T19:03:00Z",
    "severity": "LESIONES_LEVES",
    "type": "DESPISTE",
    "vehicles": [
      "MOTOCICLETA",
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5894.44,
    "approxLateralOffsetM": 14.52
  },
  {
    "id": "CRASH-2024-068",
    "coordinates": [
      -76.937893,
      -12.225705
    ],
    "year": 2024,
    "timestamp": "2024-03-18T02:10:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "VOLCADURA",
    "vehicles": [
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 5626.18,
    "approxLateralOffsetM": 9.04
  },
  {
    "id": "CRASH-2024-069",
    "coordinates": [
      -76.945385,
      -12.210684
    ],
    "year": 2024,
    "timestamp": "2024-11-08T08:50:00Z",
    "severity": "FATAL",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOTAXI",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3766.89,
    "approxLateralOffsetM": -5.86
  },
  {
    "id": "CRASH-2024-070",
    "coordinates": [
      -76.942389,
      -12.216521
    ],
    "year": 2024,
    "timestamp": "2024-04-21T04:58:00Z",
    "severity": "SOLO_DANOS",
    "type": "CHOQUE",
    "vehicles": [
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 4493.75,
    "approxLateralOffsetM": -14.64
  },
  {
    "id": "CRASH-2024-071",
    "coordinates": [
      -76.954806,
      -12.192313
    ],
    "year": 2024,
    "timestamp": "2024-08-23T09:44:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "VOLCADURA",
    "vehicles": [
      "MOTOTAXI",
      "AUTOMOVIL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1481.41,
    "approxLateralOffsetM": 3.66
  },
  {
    "id": "CRASH-2024-072",
    "coordinates": [
      -76.945975,
      -12.209545
    ],
    "year": 2024,
    "timestamp": "2024-01-03T07:43:00Z",
    "severity": "FATAL",
    "type": "CHOQUE",
    "vehicles": [
      "CAMION_CARGA",
      "MOTOCICLETA"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 3624.97,
    "approxLateralOffsetM": -0.05
  },
  {
    "id": "CRASH-2024-073",
    "coordinates": [
      -76.942278,
      -12.215368
    ],
    "year": 2024,
    "timestamp": "2024-08-17T20:28:00Z",
    "severity": "LESIONES_LEVES",
    "type": "CHOQUE",
    "vehicles": [
      "BUS_INTERPROVINCIAL"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 4383.82,
    "approxLateralOffsetM": 52.53
  },
  {
    "id": "CRASH-2024-074",
    "coordinates": [
      -76.955226,
      -12.191864
    ],
    "year": 2024,
    "timestamp": "2024-06-14T10:20:00Z",
    "severity": "LESIONES_LEVES",
    "type": "ATROPELLO",
    "vehicles": [
      "AUTOMOVIL",
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 1417.42,
    "approxLateralOffsetM": -16.78
  },
  {
    "id": "CRASH-2024-075",
    "coordinates": [
      -76.934331,
      -12.232862
    ],
    "year": 2024,
    "timestamp": "2024-02-11T08:20:00Z",
    "severity": "LESIONES_GRAVES",
    "type": "DESPISTE",
    "vehicles": [
      "MOTOTAXI"
    ],
    "roadCode": "PE-1S",
    "approxStationMeters": 6512.56,
    "approxLateralOffsetM": -10.35
  }
] as unknown as CrashPoint[];
