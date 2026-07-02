// Keyboard input binding for play and home screens.

export interface PlayKeyHandlers {
  on_choice: (idx: number) => void;
  on_home: () => void;
}

export interface HomeKeyHandlers {
  on_mode_select: (mode_idx: number) => void;
}

//============================================

// Attach keyboard listeners. Returns unbind function.
// 1-8 -> on_choice(0..7), Escape -> on_home.
export function bind_play_keys(handlers: PlayKeyHandlers): () => void {
  function keydown(e: KeyboardEvent): void {
    if (e.key >= "1" && e.key <= "8") {
      const choice_idx = parseInt(e.key, 10) - 1;
      // Silently ignore if choice_idx is out of bounds;
      // the handler will be called but may not match any button
      e.preventDefault();
      handlers.on_choice(choice_idx);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handlers.on_home();
    }
  }

  window.addEventListener("keydown", keydown);

  function unbind(): void {
    window.removeEventListener("keydown", keydown);
  }

  return unbind;
}

//============================================

// Attach keyboard listeners for home screen. Returns unbind function.
// 1-3 -> select game mode.
export function bind_home_keys(handlers: HomeKeyHandlers): () => void {
  function keydown(e: KeyboardEvent): void {
    if (e.key >= "1" && e.key <= "3") {
      e.preventDefault();
      handlers.on_mode_select(parseInt(e.key, 10) - 1);
    }
  }

  window.addEventListener("keydown", keydown);

  function unbind(): void {
    window.removeEventListener("keydown", keydown);
  }

  return unbind;
}
