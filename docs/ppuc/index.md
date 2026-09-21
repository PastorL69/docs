# PPUC

PPUC is the controller side of the project: the software that runs the game, and the IO boards that read switches and drive coils, lamps, and LEDs.

<div class="grid cards" markdown>

- :material-rocket-launch:{ .lg .middle } __Getting Started__

    ---

    Plan the wiring, flash the boards, and pick a CPU.

    [:octicons-arrow-right-24: Start here](getting_started.md)

- :material-application-cog:{ .lg .middle } __Config Tool__

    ---

    Describe the switches, lamps, and coils of your machine.

    [:octicons-arrow-right-24: Configuration](config_tool.md)

- :material-hammer-wrench:{ .lg .middle } __Build from Source__

    ---

    Compile the PPUC command-line tool yourself.

    [:octicons-arrow-right-24: Build it](build_from_source.md)

- :material-play-circle:{ .lg .middle } __Run PPUC__

    ---

    Start a ROM on a Raspberry Pi or another small computer.

    [:octicons-arrow-right-24: Running a game](how_to_run.md)

- :material-developer-board:{ .lg .middle } __Hardware__

    ---

    Which PCB does what, and how the boards are wired.

    [:octicons-arrow-right-24: Boards](../ppuc_hardware/index.md)

- :fontawesome-brands-github:{ .lg .middle } __Source__

    ---

    The PPUC repository and its latest releases on GitHub.

    [:octicons-arrow-right-24: PPUC on GitHub](https://github.com/PPUC/ppuc)

</div>

A PPUC board can replace missing or broken driver electronics, or drive a homebrew playfield. Several boards share one RS485 bus, and a small computer running [libpinmame](https://github.com/PPUC/ppuc) acts as the CPU.

