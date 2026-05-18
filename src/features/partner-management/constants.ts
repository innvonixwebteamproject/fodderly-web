export interface PartnerLocationOption {
  value: string;
  label: string;
}

export type PartnerVillageOption = PartnerLocationOption;

export interface PartnerTalukaOption extends PartnerLocationOption {
  villages: PartnerVillageOption[];
}

export interface PartnerDistrictOption extends PartnerLocationOption {
  pinCodes: string[];
  talukas: PartnerTalukaOption[];
}

export interface PartnerStateOption extends PartnerLocationOption {
  districts: PartnerDistrictOption[];
}

export const PARTNER_LOCATION_DATA: PartnerStateOption[] = [
  {
    value: "maharashtra",
    label: "Maharashtra",
    districts: [
      {
        value: "pune",
        label: "Pune",
        pinCodes: ["411001", "411014", "412105"],
        talukas: [
          {
            value: "haveli",
            label: "Haveli",
            villages: [
              { value: "wagholi", label: "Wagholi" },
              { value: "manjari", label: "Manjari" },
            ],
          },
          {
            value: "mulshi",
            label: "Mulshi",
            villages: [
              { value: "pirangut", label: "Pirangut" },
              { value: "paud", label: "Paud" },
            ],
          },
        ],
      },
      {
        value: "nashik",
        label: "Nashik",
        pinCodes: ["422001", "422003", "423101"],
        talukas: [
          {
            value: "nashik",
            label: "Nashik",
            villages: [
              { value: "gangapur", label: "Gangapur" },
              { value: "satpur", label: "Satpur" },
            ],
          },
          {
            value: "sinnar",
            label: "Sinnar",
            villages: [
              { value: "musalgaon", label: "Musalgaon" },
              { value: "thanegaon", label: "Thanegaon" },
            ],
          },
        ],
      },
    ],
  },
  {
    value: "gujarat",
    label: "Gujarat",
    districts: [
      {
        value: "ahmedabad",
        label: "Ahmedabad",
        pinCodes: ["380001", "380015", "382330"],
        talukas: [
          {
            value: "daskroi",
            label: "Daskroi",
            villages: [
              { value: "bopal", label: "Bopal" },
              { value: "vatva", label: "Vatva" },
            ],
          },
        ],
      },
      {
        value: "surat",
        label: "Surat",
        pinCodes: ["395001", "395007", "394510"],
        talukas: [
          {
            value: "chorasi",
            label: "Chorasi",
            villages: [
              { value: "vesu", label: "Vesu" },
              { value: "abhva", label: "Abhva" },
            ],
          },
        ],
      },
    ],
  },
];

export const PARTNER_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const COMPANY_TYPE_OPTIONS = [
  { value: "pvt", label: "Pvt" },
  { value: "llp", label: "LLP" },
] as const;
