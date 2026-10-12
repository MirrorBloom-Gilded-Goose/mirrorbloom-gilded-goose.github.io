/* ==========================================================================
   MAP PINS. Positions are in pixels on the 1600 x 1100 map (x from the left,
   y from the top). Turn on "Pin mode" on the map page and click anywhere to
   read off a position, then change the numbers here.
   ========================================================================== */
window.MB_MAP = {
  width: 1600, height: 1100,
  nations: [
    { name: 'The Shining Everlast', x: 545, y: 495, page: 'empires.html', note: 'The empire of Hopelight. Its reflection below is the Last Shine.' },
    { name: 'The Yenfin Empire', x: 385, y: 655, page: 'yenfin.html', note: 'The first empire, and where the dig began.' },
    { name: 'The Kenanism Empire', x: 905, y: 615, page: 'kenanism.html', note: 'Out on Solmarch’s far eastern reach, built around a mana leyline. Mutation is sacred here.' },
    { name: 'Vesperia', x: 1180, y: 345, page: 'world.html#umbral-crown', note: 'The Umbral Crown.' },
    { name: 'Thornhearth', x: 1310, y: 470, page: 'world.html#umbral-crown', note: 'The Umbral Crown.' },
    { name: 'Valerian', x: 1185, y: 545, page: 'world.html#umbral-crown', note: 'The Umbral Crown.' },
    { name: 'Ironpeak', x: 1020, y: 815, page: 'world.html#ironpeak', note: 'The mountain empire of the original ten races.' },
    { name: 'Starfall', x: 1170, y: 870, page: 'world.html#third-continent', note: 'The third continent.' },
    { name: 'Lysandra', x: 905, y: 900, page: 'world.html#third-continent', note: 'The third continent.' },
    { name: 'The Skyhold Dominion', x: 1170, y: 120, page: 'world.html#skyhold', note: 'Fifteen islands held aloft by one ley well.' },
    { name: 'The Deepmarch Collective', x: 1080, y: 690, page: 'world.html#deep-kingdoms', note: 'A tunnel kingdom beneath the sea.', deep: true },
    { name: 'The Abyssal Thrones', x: 700, y: 935, page: 'world.html#deep-kingdoms', note: 'A tunnel kingdom beneath the sea.', deep: true },
    { name: 'The Tidebound Kingdoms', x: 1390, y: 740, page: 'world.html#deep-kingdoms', note: 'A tunnel kingdom beneath the sea.', deep: true }
  ],
  kingdoms: [
    { name: 'Vaelgard', x: 440, y: 330, page: 'world.html#vaelgard', note: 'The warrior kingdom, with an affinity for frost.' },
    { name: 'Kelvarion', x: 700, y: 720, page: 'world.html#kelvarion', note: 'Flooded out the invaders at the Siege. Still owed.' }
  ],
  places: [
    { name: 'The northern wastes', x: 640, y: 215, page: 'crockett.html#vesper', note: 'Once frozen. Crockett and Vesper turned them into a desert in two days.' },
    { name: 'The Boundary', x: 52, y: 470, page: 'cosmology.html#shape', note: 'Where Solance stops. The land gives way to open space, gravity weakens the closer you get, and somewhere beneath lies Umbrasol.' },
    { name: 'A failed colony', x: 1555, y: 285, page: 'cosmology.html#shape', note: 'People keep trying to settle the open space beyond the edge. Umbrasol has attacked and ruined every attempt, even ones launched from the far side of the world.' },
    { name: 'A failed colony', x: 40, y: 845, page: 'cosmology.html#shape', note: 'Another settlement beyond the Boundary, abandoned after Umbrasol came for it.' }
  ],
  wells: [
    { x: 1170, y: 152, note: 'The well that holds Skyhold aloft.' },
    { x: 300, y: 560, note: 'A ley line well, guarded by Kenanism.' },
    { x: 960, y: 655, note: 'The wellspring at the heart of Kenanism.' },
    { x: 1100, y: 935, note: 'A ley line well, guarded by Kenanism.' }
  ],
  tunnels: [
    [[985, 640], [1080, 690], [1150, 600]],
    [[650, 790], [700, 935], [850, 925]],
    [[1330, 610], [1390, 740], [1270, 840]]
  ],
  currents: [
    [[210, 300], [520, 135], [900, 105], [1340, 215], [1480, 540], [1350, 880], [900, 985], [420, 945], [150, 700], [210, 300]],
    [[300, 820], [780, 640], [1300, 320]]
  ]
};
