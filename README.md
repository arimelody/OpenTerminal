# OpenTerminal
An online terminal and communal text buffer

![openterminal thumbnail image](public/img/thumbnail.png)

## how it works

a simple static web server pushes out the html, css and javascript needed to make this function well and look pretty on client devices. from there, clients connect back to the server's websocket, which they then exchange keystroke information with, back and forth, all passing through the server's own saved buffer. (if you refresh the page, everything's still there!)

### wouldn't this be really easy to grief?

yes!

jokes aside- while i do absolutely see how an open, self-moderated text buffer is hilariously easy to grief, i could also imagine users taking the concept and pushing it quite a bit further than what i'm doing here. who knows? maybe a anti-spam bot could come in, read through the buffer for any *nefarious* material, and backpedal through the buffer just enough to remove it, before replacing the otherwise above-board text from memory.

...or maybe it'll just become a garbage-posting haven. regardless, it's a fun little idea, so i made it anyway.

## roadmap

- rewrite backend in go/rust (me no like javascript raaaahhh)
- colour palette switcher in the UI (rather than in console)
- multiple "channels" (at least if one gets flooded, there's somewhere else you can go)

### "maybe" roadmap

- master server (anyone can host a channel and post to the MS)
- channel logs (for recovery in the event of a crash, as an optional feature)

