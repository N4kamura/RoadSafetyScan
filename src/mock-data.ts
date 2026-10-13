/**
 * Mock Data del Corredor Panamericana Sur (PE-1S)
 */

import { CrashPoint, SeverityLevel, CrashType } from './pkg/lrs/types.js';

export const MOCK_ALIGNMENT_DATA = {
  "id": "AL-PE-PANASUR-01",
  "name": "Corredor Panamericana Sur (Km 18 al 25)",
  "totalLength": 7634.47,
  "vertices": [
    {
      "index": 0,
      "coordinates": {
        "longitude": -76.96,
        "latitude": -12.18
      },
      "cumulativeDistance": 0,
      "stationFormatted": "km 0+000.00"
    },
    {
      "index": 1,
      "coordinates": {
        "longitude": -76.958,
        "latitude": -12.185
      },
      "cumulativeDistance": 596.96,
      "stationFormatted": "km 0+596.96"
    },
    {
      "index": 2,
      "coordinates": {
        "longitude": -76.955,
        "latitude": -12.192
      },
      "cumulativeDistance": 1440.86,
      "stationFormatted": "km 1+440.86"
    },
    {
      "index": 3,
      "coordinates": {
        "longitude": -76.951,
        "latitude": -12.2
      },
      "cumulativeDistance": 2430.98,
      "stationFormatted": "km 2+430.98"
    },
    {
      "index": 4,
      "coordinates": {
        "longitude": -76.948,
        "latitude": -12.206
      },
      "cumulativeDistance": 3173.55,
      "stationFormatted": "km 3+173.55"
    },
    {
      "index": 5,
      "coordinates": {
        "longitude": -76.944,
        "latitude": -12.213
      },
      "cumulativeDistance": 4065.09,
      "stationFormatted": "km 4+065.09"
    },
    {
      "index": 6,
      "coordinates": {
        "longitude": -76.94,
        "latitude": -12.221
      },
      "cumulativeDistance": 5055.18,
      "stationFormatted": "km 5+055.18"
    },
    {
      "index": 7,
      "coordinates": {
        "longitude": -76.937,
        "latitude": -12.228
      },
      "cumulativeDistance": 5899.07,
      "stationFormatted": "km 5+899.07"
    },
    {
      "index": 8,
      "coordinates": {
        "longitude": -76.933,
        "latitude": -12.235
      },
      "cumulativeDistance": 6790.59,
      "stationFormatted": "km 6+790.59"
    },
    {
      "index": 9,
      "coordinates": {
        "longitude": -76.93,
        "latitude": -12.242
      },
      "cumulativeDistance": 7634.47,
      "stationFormatted": "km 7+634.47"
    }
  ],
  "coordinates": [
    [
      -76.96,
      -12.18
    ],
    [
      -76.958,
      -12.185
    ],
    [
      -76.955,
      -12.192
    ],
    [
      -76.951,
      -12.2
    ],
    [
      -76.948,
      -12.206
    ],
    [
      -76.944,
      -12.213
    ],
    [
      -76.94,
      -12.221
    ],
    [
      -76.937,
      -12.228
    ],
    [
      -76.933,
      -12.235
    ],
    [
      -76.93,
      -12.242
    ]
  ]
};

export const MOCK_CRASHES_DATA: CrashPoint[] = [
  {
    "id": "CRASH-2024-001",
    "coordinates": [
      -76.959215,
      -12.182002
    ],
    "year": 2024,
    "timestamp": "2024-07-02T00:05:00Z",
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
    "id": "CRASH-2024-002",
    "coordinates": [
      -76.936639,
      -12.228897
    ],
    "year": 2024,
    "timestamp": "2024-10-09T00:48:00Z",
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
    "id": "CRASH-2024-003",
    "coordinates": [
      -76.939185,
      -12.223152
    ],
    "year": 2024,
    "timestamp": "2024-07-04T11:54:00Z",
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
    "id": "CRASH-2024-004",
    "coordinates": [
      -76.944977,
      -12.211681
    ],
    "year": 2024,
    "timestamp": "2024-11-20T11:36:00Z",
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
    "id": "CRASH-2024-005",
    "coordinates": [
      -76.954724,
      -12.192494
    ],
    "year": 2024,
    "timestamp": "2024-07-09T14:40:00Z",
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
    "id": "CRASH-2024-006",
    "coordinates": [
      -76.955697,
      -12.190673
    ],
    "year": 2024,
    "timestamp": "2024-11-06T17:46:00Z",
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
    "id": "CRASH-2024-007",
    "coordinates": [
      -76.944645,
      -12.212438
    ],
    "year": 2024,
    "timestamp": "2024-01-26T10:25:00Z",
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
    "id": "CRASH-2024-008",
    "coordinates": [
      -76.95378,
      -12.194123
    ],
    "year": 2024,
    "timestamp": "2024-03-09T04:15:00Z",
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
    "id": "CRASH-2024-009",
    "coordinates": [
      -76.943893,
      -12.213407
    ],
    "year": 2024,
    "timestamp": "2024-03-17T15:05:00Z",
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
    "id": "CRASH-2024-010",
    "coordinates": [
      -76.934095,
      -12.232996
    ],
    "year": 2024,
    "timestamp": "2024-09-09T17:55:00Z",
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
    "id": "CRASH-2024-011",
    "coordinates": [
      -76.939515,
      -12.221975
    ],
    "year": 2024,
    "timestamp": "2024-05-14T05:29:00Z",
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
    "id": "CRASH-2024-012",
    "coordinates": [
      -76.936684,
      -12.228696
    ],
    "year": 2024,
    "timestamp": "2024-11-17T19:12:00Z",
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
    "id": "CRASH-2024-013",
    "coordinates": [
      -76.956094,
      -12.189587
    ],
    "year": 2024,
    "timestamp": "2024-02-12T09:15:00Z",
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
    "id": "CRASH-2024-014",
    "coordinates": [
      -76.936742,
      -12.228487
    ],
    "year": 2024,
    "timestamp": "2024-11-16T17:10:00Z",
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
    "id": "CRASH-2024-015",
    "coordinates": [
      -76.937284,
      -12.227232
    ],
    "year": 2024,
    "timestamp": "2024-07-22T20:23:00Z",
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
    "id": "CRASH-2024-016",
    "coordinates": [
      -76.937354,
      -12.227101
    ],
    "year": 2024,
    "timestamp": "2024-04-01T02:45:00Z",
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
    "id": "CRASH-2024-017",
    "coordinates": [
      -76.95346,
      -12.194609
    ],
    "year": 2024,
    "timestamp": "2024-12-19T18:30:00Z",
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
    "id": "CRASH-2024-018",
    "coordinates": [
      -76.94591,
      -12.209598
    ],
    "year": 2024,
    "timestamp": "2024-12-02T21:41:00Z",
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
    "id": "CRASH-2024-019",
    "coordinates": [
      -76.957381,
      -12.186643
    ],
    "year": 2024,
    "timestamp": "2024-04-07T17:28:00Z",
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
    "id": "CRASH-2024-020",
    "coordinates": [
      -76.955129,
      -12.191456
    ],
    "year": 2024,
    "timestamp": "2024-11-18T00:05:00Z",
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
    "id": "CRASH-2024-021",
    "coordinates": [
      -76.934488,
      -12.232247
    ],
    "year": 2024,
    "timestamp": "2024-07-01T12:16:00Z",
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
    "id": "CRASH-2024-022",
    "coordinates": [
      -76.93659,
      -12.228461
    ],
    "year": 2024,
    "timestamp": "2024-05-07T01:37:00Z",
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
    "id": "CRASH-2024-023",
    "coordinates": [
      -76.958309,
      -12.184271
    ],
    "year": 2024,
    "timestamp": "2024-09-03T05:04:00Z",
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
    "id": "CRASH-2024-024",
    "coordinates": [
      -76.939673,
      -12.221667
    ],
    "year": 2024,
    "timestamp": "2024-10-02T19:05:00Z",
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
    "id": "CRASH-2024-025",
    "coordinates": [
      -76.937465,
      -12.227029
    ],
    "year": 2024,
    "timestamp": "2024-07-05T21:41:00Z",
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
    "id": "CRASH-2024-026",
    "coordinates": [
      -76.943907,
      -12.213476
    ],
    "year": 2024,
    "timestamp": "2024-09-07T16:16:00Z",
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
    "id": "CRASH-2024-027",
    "coordinates": [
      -76.944333,
      -12.212779
    ],
    "year": 2024,
    "timestamp": "2024-11-27T17:19:00Z",
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
    "id": "CRASH-2024-028",
    "coordinates": [
      -76.957103,
      -12.186909
    ],
    "year": 2024,
    "timestamp": "2024-05-20T06:45:00Z",
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
    "id": "CRASH-2024-029",
    "coordinates": [
      -76.937348,
      -12.227357
    ],
    "year": 2024,
    "timestamp": "2024-11-14T08:02:00Z",
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
    "id": "CRASH-2024-030",
    "coordinates": [
      -76.955517,
      -12.190958
    ],
    "year": 2024,
    "timestamp": "2024-02-03T22:57:00Z",
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
    "id": "CRASH-2024-031",
    "coordinates": [
      -76.955381,
      -12.190893
    ],
    "year": 2024,
    "timestamp": "2024-06-07T21:15:00Z",
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
    "id": "CRASH-2024-032",
    "coordinates": [
      -76.949985,
      -12.202356
    ],
    "year": 2024,
    "timestamp": "2024-03-26T05:56:00Z",
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
    "id": "CRASH-2024-033",
    "coordinates": [
      -76.955292,
      -12.19161
    ],
    "year": 2024,
    "timestamp": "2024-03-26T22:06:00Z",
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
    "id": "CRASH-2024-034",
    "coordinates": [
      -76.954958,
      -12.192242
    ],
    "year": 2024,
    "timestamp": "2024-01-22T06:25:00Z",
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
    "id": "CRASH-2024-035",
    "coordinates": [
      -76.954705,
      -12.192638
    ],
    "year": 2024,
    "timestamp": "2024-05-06T18:16:00Z",
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
    "id": "CRASH-2024-036",
    "coordinates": [
      -76.937709,
      -12.226134
    ],
    "year": 2024,
    "timestamp": "2024-10-07T08:02:00Z",
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
    "id": "CRASH-2024-037",
    "coordinates": [
      -76.959657,
      -12.180475
    ],
    "year": 2024,
    "timestamp": "2024-07-03T21:58:00Z",
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
    "id": "CRASH-2024-038",
    "coordinates": [
      -76.945597,
      -12.210275
    ],
    "year": 2024,
    "timestamp": "2024-12-10T17:08:00Z",
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
    "id": "CRASH-2024-039",
    "coordinates": [
      -76.937066,
      -12.22739
    ],
    "year": 2024,
    "timestamp": "2024-05-10T06:27:00Z",
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
    "id": "CRASH-2024-040",
    "coordinates": [
      -76.941818,
      -12.217521
    ],
    "year": 2024,
    "timestamp": "2024-08-26T23:10:00Z",
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
    "id": "CRASH-2024-041",
    "coordinates": [
      -76.952064,
      -12.198078
    ],
    "year": 2024,
    "timestamp": "2024-04-26T06:09:00Z",
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
    "id": "CRASH-2024-042",
    "coordinates": [
      -76.955618,
      -12.190113
    ],
    "year": 2024,
    "timestamp": "2024-08-13T07:09:00Z",
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
    "id": "CRASH-2024-043",
    "coordinates": [
      -76.959709,
      -12.180775
    ],
    "year": 2024,
    "timestamp": "2024-04-06T22:33:00Z",
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
    "id": "CRASH-2024-044",
    "coordinates": [
      -76.936771,
      -12.2279
    ],
    "year": 2024,
    "timestamp": "2024-09-15T05:47:00Z",
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
    "id": "CRASH-2024-045",
    "coordinates": [
      -76.946798,
      -12.208099
    ],
    "year": 2024,
    "timestamp": "2024-08-03T22:18:00Z",
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
    "id": "CRASH-2024-046",
    "coordinates": [
      -76.946537,
      -12.208697
    ],
    "year": 2024,
    "timestamp": "2024-02-14T13:21:00Z",
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
    "id": "CRASH-2024-047",
    "coordinates": [
      -76.947832,
      -12.206002
    ],
    "year": 2024,
    "timestamp": "2024-07-16T00:22:00Z",
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
    "id": "CRASH-2024-048",
    "coordinates": [
      -76.944403,
      -12.212805
    ],
    "year": 2024,
    "timestamp": "2024-04-09T13:31:00Z",
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
    "id": "CRASH-2024-049",
    "coordinates": [
      -76.945953,
      -12.209986
    ],
    "year": 2024,
    "timestamp": "2024-09-01T12:37:00Z",
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
    "id": "CRASH-2024-050",
    "coordinates": [
      -76.959189,
      -12.182145
    ],
    "year": 2024,
    "timestamp": "2024-08-11T10:48:00Z",
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
    "id": "CRASH-2024-051",
    "coordinates": [
      -76.952198,
      -12.197725
    ],
    "year": 2024,
    "timestamp": "2024-01-24T17:03:00Z",
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
    "id": "CRASH-2024-052",
    "coordinates": [
      -76.950085,
      -12.202123
    ],
    "year": 2024,
    "timestamp": "2024-01-20T04:15:00Z",
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
    "id": "CRASH-2024-053",
    "coordinates": [
      -76.937532,
      -12.226163
    ],
    "year": 2024,
    "timestamp": "2024-03-10T03:37:00Z",
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
    "id": "CRASH-2024-054",
    "coordinates": [
      -76.944331,
      -12.212922
    ],
    "year": 2024,
    "timestamp": "2024-10-23T20:15:00Z",
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
    "id": "CRASH-2024-055",
    "coordinates": [
      -76.945774,
      -12.20969
    ],
    "year": 2024,
    "timestamp": "2024-09-14T21:23:00Z",
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
    "id": "CRASH-2024-056",
    "coordinates": [
      -76.937706,
      -12.226697
    ],
    "year": 2024,
    "timestamp": "2024-07-06T23:33:00Z",
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
    "id": "CRASH-2024-057",
    "coordinates": [
      -76.952209,
      -12.197114
    ],
    "year": 2024,
    "timestamp": "2024-12-19T08:20:00Z",
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
    "id": "CRASH-2024-058",
    "coordinates": [
      -76.934961,
      -12.231111
    ],
    "year": 2024,
    "timestamp": "2024-08-28T10:11:00Z",
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
    "id": "CRASH-2024-059",
    "coordinates": [
      -76.944439,
      -12.212162
    ],
    "year": 2024,
    "timestamp": "2024-09-07T02:15:00Z",
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
    "id": "CRASH-2024-060",
    "coordinates": [
      -76.945596,
      -12.210432
    ],
    "year": 2024,
    "timestamp": "2024-02-10T07:25:00Z",
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
    "id": "CRASH-2024-061",
    "coordinates": [
      -76.951413,
      -12.199458
    ],
    "year": 2024,
    "timestamp": "2024-05-10T08:14:00Z",
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
    "id": "CRASH-2024-062",
    "coordinates": [
      -76.95552,
      -12.191002
    ],
    "year": 2024,
    "timestamp": "2024-12-16T08:46:00Z",
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
    "id": "CRASH-2024-063",
    "coordinates": [
      -76.937252,
      -12.22692
    ],
    "year": 2024,
    "timestamp": "2024-04-12T05:19:00Z",
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

export const MOCK_ALIGNMENT_NORTE_DATA = {
  id: "AL-PE-PANANORTE-02",
  name: "Corredor Panamericana Norte (Km 35 al 41)",
  coordinates: [
    [-77.1750, -11.7800],
    [-77.1690, -11.7650],
    [-77.1620, -11.7510],
    [-77.1560, -11.7380],
    [-77.1510, -11.7250]
  ]
};

export const MOCK_CRASHES_NORTE_DATA: CrashPoint[] = [
  { id: "CRASH-N-01", coordinates: [-77.1742, -11.7785], severity: SeverityLevel.FATAL, type: CrashType.CHOQUE },
  { id: "CRASH-N-02", coordinates: [-77.1738, -11.7760], severity: SeverityLevel.LESIONES_GRAVES, type: CrashType.DESPISTE },
  { id: "CRASH-N-03", coordinates: [-77.1685, -11.7640], severity: SeverityLevel.FATAL, type: CrashType.ATROPELLO },
  { id: "CRASH-N-04", coordinates: [-77.1678, -11.7620], severity: SeverityLevel.LESIONES_LEVES, type: CrashType.CHOQUE },
  { id: "CRASH-N-05", coordinates: [-77.1615, -11.7505], severity: SeverityLevel.SOLO_DANOS, type: CrashType.VOLCADURA },
  { id: "CRASH-N-06", coordinates: [-77.1610, -11.7490], severity: SeverityLevel.FATAL, type: CrashType.CHOQUE },
  { id: "CRASH-N-07", coordinates: [-77.1555, -11.7370], severity: SeverityLevel.LESIONES_GRAVES, type: CrashType.DESPISTE },
  { id: "CRASH-N-08", coordinates: [-77.1548, -11.7355], severity: SeverityLevel.SOLO_DANOS, type: CrashType.CHOQUE },
  { id: "CRASH-N-09", coordinates: [-77.1505, -11.7240], severity: SeverityLevel.LESIONES_LEVES, type: CrashType.ATROPELLO }
];

