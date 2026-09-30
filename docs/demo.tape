Output "docs/demo.gif"
Output "docs/demo.mp4"

Set Shell zsh
Set FontSize 22
# 1400px is 93 columns, which wraps the pnpm echo of the first question.
Set Width 1520
Set Height 700
Set Padding 30
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms
# Spinner frames change constantly; 15fps keeps the GIF under 10 MB.
Set Framerate 15
Set CursorBlink false

# VHS applies Env to its own process before it starts ttyd, and it does not
# expand $HOME or $PATH. Keep node (pnpm), git/grok, and ttyd/ffmpeg on PATH.
Env PATH "/Users/maxim/.local/homebrew/bin:/opt/homebrew/bin:/Users/maxim/.local/node/bin:/Users/maxim/.homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

Hide
Type "cd /Users/maxim/Projects/Hackatons/20260930_Cursor_Hackathon_Prague/whereis-dev"
Enter
Type "clear"
Enter
Sleep 500ms
Show

Type `pnpm dev ask "where is the response json method implemented?" -d ../demo-repos/express`
Enter
Wait+Screen@60s /Blast radius/
Sleep 4s

# Drop the first "Blast radius" so the next wait is for the second answer.
Type "clear"
Enter
Sleep 300ms

Type `pnpm dev ask "where is the view engine rendering done?" -d ../demo-repos/express`
Enter
Wait+Screen@60s /Blast radius/
Sleep 4s
