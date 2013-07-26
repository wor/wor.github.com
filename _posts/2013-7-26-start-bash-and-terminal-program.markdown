---
layout:     post
categories: bash
published:  true

orglayout:   post
title:      "Start bash and terminal program"
date:       2013-7-26 14:27:00
---

Start bash and terminal program
===============================
(So that job control works.)

While ago I tried to make an .desktop file to start bash shell and list
directory contents and not exit.

This was the command which I ended up with:

    urxvtc -e bash -i -c "cd %f; ls; exec bash"

It starts terminal (in this case urxvtc) which in turn runs bash commands "cd
<some path>", "ls" and "exec bash". The "exec bash" command is needed to stop
the parent bash from exiting immediately after "ls" command has finished.

This is basically the answer this question:
(bash-execute-command-given-in-commandline-and-dont-exit)
[http://superuser.com/questions/344478/bash-execute-command-given-in-commandline-and-dont-exit/586502#586502].
The problem with this is that if one wants to start e.g. vim like this:

    urxvtc -e bash -i -c "vim; exec bash"

It superficially works, vim is started and after quitting vim a bash shell is
presented. But inside vim job control doesn't work as expected. One cannot
suspend vim and do something inside bash and then return to the vim instance by
foregrounding it. This is because "exec bash" is ran only after vim has exited.

So how to solve this problem?

First idea as presented in the (superuser question)
[http://superuser.com/questions/344478/bash-execute-command-given-in-commandline-and-dont-exit/586502#586502]
was to modify ".bashrc" to start the vim. Here it's done dynamically by creating
new bashrc file on-the-fly from an existing one:

    bash --rcfile <(cat ${HOME}/.bashrc; echo 'vim') -i

The problem with this is that the job control is initialized only after .bashrc
has been processed, so it still doesn't work with vim.

To overcome this problem the vim or any other program should be start only after
the job control have been initialized. So how to do this with bash?

I couldn't find a proper solution, only a very hackish one:

    bash --rcfile <(cat ${HOME}/.bashrc; echo 'export PROMPT_COMMAND="vim;
    export PROMPT_COMMAND="') -i

The idea is to abuse "PROMPT_COMMAND" to delay the vim start so that job control
already works. There are probably other similar solutions, but I would be very
happy to hear about a "clean" way to do this. I thought of adding this
functionality to my (xdg-open clone)[https://github.com/wor/pyxdg-open] but it
just seems too hackish even for me ;)
