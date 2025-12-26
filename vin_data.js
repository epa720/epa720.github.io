// VIN decoding data - same as your JSON file but in JS format
const vinData = {
"1": {
        "title": "COUNTRY",
        "codes": {
            "U": "Corris Britain"
        }
    },
    "2": {
        "title": "ASSEMBLY PLANT",
        "codes": {
            "A": "Dagenham",
            "B": "Manchester",
            "C": "Saarlouis",
            "K": "Rheine"
        }
    },
    "3": {
        "title": "MODEL",
        "codes": {
            "B": "Rivett"
        }
    },
    "4": {
        "title": "BODY TYPE",
        "codes": {
            "B": "2D Pillared Sedan"
        }
    },
    "5": {
        "title": "VERSION",
        "codes": {
            "D": "L",
            "E": "LX",
            "G": "SLX",
            "B": "GT"
        }
    },
    "6": {
        "title": "YEAR",
        "codes": {
            "L": "1971",
            "M": "1972",
            "N": "1973",
            "P": "1974 (Facelift)",
            "R": "1975 (Facelift)",
            "S": "1976 (Facelift)"
        }
    },
    "7": {
        "title": "MONTH",
        "codes": {
            "C": "01",
            "K": "02",
            "D": "03",
            "E": "04",
            "L": "05",
            "Y": "06",
            "S": "07",
            "T": "08",
            "J": "09",
            "U": "10",
            "M": "11",
            "P": "12"
        }
    },
    "8": {
        "title": "SERIAL NUMBER",
        "codes": {
            "-": "-"
        }
    },
    "9": {
        "title": "DRIVE",
        "codes": {
            "1": "RWD"
        }
    },
    "10": {
        "title": "ENGINE",
        "codes": {
            "NA": "Standard 2.0",
            "NE": "High Performance 2.0"
        }
    },
    "11": {
        "title": "GEARBOX",
        "codes": {
            "7": "3-spd Automatic",
            "B": "4-spd Manual"
        }
    },
    "12": {
        "title": "AXLE RATIO",
        "codes": {
            "S": "3.44",
            "B": "3.75",
            "C": "3.89",
            "N": "4.11",
            "E": "4.44"
        }
    },
    "13": {
        "title": "AXLE LOCK",
        "codes": {
            "A": "Open",
            "B": "LSD"
        }
    },
    "14": {
        "title": "BODY COLOUR",
        "codes": {
            "A": "Dark Grey",
            "B": "Nature White",
            "C": "Sand",
            "D": "Asphalt Grey",
            "E": "Blue",
            "F": "Sun Yellow",
            "G": "Dark Navy",
            "H": "Royal Red",
            "I": "Brown",
            "J": "Red",
            "K": "Electric Green",
            "L": "White Pearl",
            "M": "Spring Green",
            "R": "Purple",
            "T": "Yellow",
            "U": "Sky Blue",
            "V": "Orange",
            "X": "Navy Blue",
            "Y": "Special"
        }
    },
    "15": {
        "title": "VINYL ROOF",
        "codes": {
            "-": "Paint",
            "A": "Black",
            "B": "White",
            "C": "Tan",
            "K": "Blue",
            "M": "Dark Brown"
        }
    },
    "16": {
        "title": "INTERIOR TRIM",
        "codes": {
            "N": "Red",
            "A": "Black",
            "K": "Tan",
            "F": "Blue",
            "Y": "Special"
        }
    },
    "17": {
        "title": "RADIO",
        "codes": {
            "-": "Radio delete",
            "J": "Radio"
        }
    },
    "18": {
        "title": "INSTRUMENT PANEL",
        "codes": {
            "-": "Standard",
            "G": "Clock",
            "M": "Technometer"
        }
    },
    "19": {
        "title": "WINDSHIELD",
        "codes": {
            "1": "Clear",
            "2": "Tinted",
            "F": "Sunstrip"
        }
    },
    "20": {
        "title": "SEATS",
        "codes": {
            "8": "Standard",
            "B": "Bucket Style"
        }
    },
    "21": {
        "title": "SUSPENSION",
        "codes": {
            "A": "Standard",
            "B": "Standard + Stiffened",
            "4": "Lowered",
            "M": "Lowered + Stiffened"
        }
    },
    "22": {
        "title": "BRAKES",
        "codes": {
            "-": "Standard",
            "B": "Power Brakes"
        }
    },
    "23": {
        "title": "WHEELS",
        "codes": {
            "A": "13\" Steel",
            "B": "13\" Steel + hubcaps",
            "4": "14\" Sport",
            "M": "14\" Steel / 14\" Octo"
        }
    },
    "24": {
        "title": "REAR WINDOW",
        "codes": {
            "-": "Standard",
            "B": "Heated",
            "M": "Standard + Window Grille"
        }
    }
};