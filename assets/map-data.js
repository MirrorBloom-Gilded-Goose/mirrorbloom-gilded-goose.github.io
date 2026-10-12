/* ==========================================================================
   MAP PINS. Positions are in pixels on the 1600 x 1100 map (x from the left,
   y from the top). Turn on "Pin mode" on the map page and click anywhere to
   read off a position, then change the numbers here.
   ========================================================================== */
window.MB_MAP = {
  width: 1600, height: 1100,
  nations: [
    { name: 'The Shining Everlast', x: 560, y: 500, page: 'empires.html', note: 'The empire of Hopelight. Its reflection below is the Last Shine.' },
    { name: 'The Yenfin Empire', x: 390, y: 650, page: 'yenfin.html', note: 'The first empire, and where the dig began.' },
    { name: 'The Kenanism Empire', x: 770, y: 470, page: 'kenanism.html', note: 'Built around a mana leyline. Mutation is sacred here.' },
    { name: 'Vesperia', x: 1160, y: 375, page: 'world.html#umbral-crown', note: 'The Umbral Crown.' },
    { name: 'Thornhearth', x: 1290, y: 500, page: 'world.html#umbral-crown', note: 'The Umbral Crown.' },
    { name: 'Valerian', x: 1150, y: 585, page: 'world.html#umbral-crown', note: 'The Umbral Crown.' },
    { name: 'Ironpeak', x: 1020, y: 830, page: 'world.html#ironpeak', note: 'The mountain empire of the original ten races.' },
    { name: 'Starfall', x: 1160, y: 885, page: 'world.html#third-continent', note: 'The third continent.' },
    { name: 'Lysandra', x: 900, y: 915, page: 'world.html#third-continent', note: 'The third continent.' },
    { name: 'The Skyhold Dominion', x: 1200, y: 150, page: 'world.html#skyhold', note: 'Fifteen islands held aloft by one ley well.' },
    { name: 'The Deepmarch Collective', x: 925, y: 650, page: 'world.html#deep-kingdoms', note: 'A tunnel kingdom beneath the sea.', deep: true },
    { name: 'The Abyssal Thrones', x: 720, y: 950, page: 'world.html#deep-kingdoms', note: 'A tunnel kingdom beneath the sea.', deep: true },
    { name: 'The Tidebound Kingdoms', x: 1390, y: 760, page: 'world.html#deep-kingdoms', note: 'A tunnel kingdom beneath the sea.', deep: true }
  ],
  kingdoms: [
    { name: 'Vaelgard', x: 450, y: 340, page: 'world.html#vaelgard', note: 'The warrior kingdom, with an affinity for frost.' },
    { name: 'Kelvarion', x: 720, y: 700, page: 'world.html#kelvarion', note: 'Flooded out the invaders at the Siege. Still owed.' }
  ],
  places: [
    { name: 'The northern wastes', x: 690, y: 300, page: 'crockett.html#vesper', note: 'Once frozen. Crockett and Vesper turned them into a desert in two days.' },
    { name: 'The Boundary', x: 95, y: 560, page: 'cosmology.html#shape', note: 'Where Solance stops, and gravity weakens.' }
  ],
  wells: [
    { x: 1200, y: 178, note: 'The well that holds Skyhold aloft.' },
    { x: 300, y: 560, note: 'A ley line well, guarded by Kenanism.' },
    { x: 985, y: 430, note: 'A ley line well, guarded by Kenanism.' },
    { x: 1090, y: 985, note: 'A ley line well, guarded by Kenanism.' }
  ],
  tunnels: [
    [[850, 600], [925, 650], [1060, 590]],
    [[650, 790], [720, 950], [860, 930]],
    [[1320, 640], [1390, 760], [1260, 860]]
  ],
  currents: [
    [[210, 300], [520, 140], [900, 115], [1340, 240], [1490, 550], [1350, 900], [900, 1020], [420, 965], [150, 700], [210, 300]],
    [[300, 820], [780, 640], [1300, 330]]
  ]
};
