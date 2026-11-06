---
title: PPUC/DMD
template: dmd_home.html
description: PPUC/DMD is a full-colour replacement dot matrix display for real pinball machines, with Serum v1 and v2 colorizations.
tagline: Full-colour DMD for real and virtual pinball machines
specs_title: Specifications
# Specification blocks below the hero: a 2x2 grid of small blocks, plus the card with a list: (supported
# systems) on the right. image: a square picture in theme/assets/img/specs/ (160x160), or
# art: gamma (smooth colour ramp). In list:,
# {name: X, soon: true} adds a small "Coming soon" tag;
# virtual: lists the virtual pinball platforms in a separate group. note: is the small line under the stat.
specs:
  - image: assets/img/specs/rp2354b.webp
    stat: RP2354B
    note: On all devices
    text: Released in 2025 by Raspberry Pi, with dual Arm Cortex-M33 cores at 266 MHz.
  - image: assets/img/specs/pi-zero-2w.webp
    stat: Zero 2 W
    note: Optional
    text: Only required to run Serum colorizations on real pinball machines.
  - art: gamma
    stat: Superb colour depth
    note: 10-bit gamma correction
    text: Keeps even near-identical colours clearly apart.
  - image: assets/img/specs/refresh.webp
    stat: High refresh rate
    note: Rock-steady performance
    text: Low frame response times and no visible flicker, even on HD displays.
  - image: assets/img/specs/dmd.webp
    stat: 15 Supported systems
    note: 13 Real pinball systems
    list: [WPC & WPC95, Data East, Sega, Stern Whitestar, Stern SAM, Stern SPIKE 1, Capcom, Gottlieb/Premier,
           Alvin G. & Co, Homepin, Spinball, Sleic/Petaco, Dotmation, {name: Spooky, soon: true}]
    virtual: [Visual Pinball, Batocera]
---
Revive your pinball machine with PPUC/DMD, a drop-in replacement for the original dot matrix display.<br>
Want full colour? Just enable Serum, the PPUC-developed colorization format.
