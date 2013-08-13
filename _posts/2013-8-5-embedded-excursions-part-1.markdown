---
layout:     post
categories: bash
published:  true

orglayout:   post
title:      "Embedded excursions part 1: Testing Yocto/Poky on Arch Linux"
date:       2013-8-11 19:00:00
modified:   2013-8-13 15:10:00
---

I'm quite new to embedded development and embedded Linux distributions, so I'll
just choose [Yocto](https://www.yoctoproject.org/) to build the root filesystem,
without extensive evaluation. Sometimes is just better to get started.
First I'll test if I can build the default qemux86 image. If everything goes ok,
I can proceed to building root fs for my Freescale Arm board,
[wandboard](http://www.wandboard.org/).

About host I'm using:

    $ head -1 /etc/os-release
    NAME="Arch Linux"

    $ uname -a
    Linux qniitty 3.10.5-1-wor #1 SMP PREEMPT Sun Aug 4 21:49:08 EEST 2013
    x86_64 GNU/Linux

Arch linux is not really validated to work as host with Yocto/Poky but let's try
it anyway. Using [Yocto v9.0.1]
(http://downloads.yoctoproject.org/releases/yocto/yocto-1.4.1/poky-dylan-9.0.1.tar.bz2).

    $ source poky-dylan-9.0.1/oe-init-build-env build
    Error: The bitbake directory (/mnt/oldhome/embed/none) does not exist!
    Please ensure a copy of bitbake exists at this location

Let's see if the [git version](http://git.yoctoproject.org/cgit/cgit.cgi/poky/)
works better, before fixing old bash scripts:

    $ git clone git://git.yoctoproject.org/poky poky-git
    $ source poky-git/oe-init-build-env build
    Bitbake is not compatible with python v3
    Please set up python v2 as your default python interpreter

At least a different error and yes, in current the Arch Linux the default python
interpreter is of version 3.x. Let's quickly fix poky/bitbake python scripts to
use python2 as the default interpreter. The "/usr/bin/env python" shebangs can
be fixed by tricking env, so no need to touch those.

    $ grep -IR '/usr/bin/python' poky-git/
    poky-git/scripts/pybootchartgui/pybootchartgui.py:#!/usr/bin/python
    poky-git/bitbake/lib/progressbar.py:#!/usr/bin/python
    ...

With some find and sed magic:

    $ find poky-git/ -type f -regextype posix-extended -regex \
    ".*\.py" -execdir sed -i -r \
    's:(#!\s?/usr/bin/python\s*$):\12:' '{}' \;

    $ grep -IR '/usr/bin/python' poky-git/
    poky-git/scripts/pybootchartgui/pybootchartgui.py:#!/usr/bin/python2
    poky-git/bitbake/lib/progressbar.py:#!/usr/bin/python2
    ...

Env tricking is done by adding new python symlinks to the beginning of the PATH
evironment variable, so that the env finds them before the actual python
executables.

    $ mkdir build/python-bin
    $ ln -s /usr/bin/python2 build/python-bin/python
    $ ln -s /usr/bin/python2-config build/python-bin/python-config
    $ export PATH=$(pwd)/build/python-bin:${PATH}
    $ /usr/bin/env python
    Python 2.7.5 (default, May 12 2013, 12:00:47)
    ...

And finally a quick modification to the "poky-git/scripts/oe-buildenv-internal"
script which is called by the "oe-init-build-env" script.

{% gist 6204718 oe-buildenv-internal.patch %}

After all this, sourcing "oe-init-build-env" works as intended:

    $ source poky-git/oe-init-build-env build
    You had no conf/local.conf file. This configuration file has therefore been
    created for you with some default values. You may wish to edit it to use a
    ...
    ### Shell environment set up for builds. ###

    You can now run 'bitbake <target>'

Before running bitmake, one can edit "conf/local.conf" file to set target
machine and other options. For this test run the default machine "qemux86" will
do.

Running bitbake in the build dir:

    $ bitbake core-image-minimal
    WARNING: Host distribution "Arch-Linux" has not been validated with this
    version of the build system; you may possibly experience unexpected failures.
    It is recommended that you use a tested distribution.
    Loading cache: 100% |###############################| ETA:  00:00:00
    Loaded 1175 entries from dependency cache.
    
    Build Configuration:
    BB_VERSION        = "1.19.1"
    BUILD_SYS         = "x86_64-linux"
    NATIVELSBSTRING   = "Arch-Linux"
    TARGET_SYS        = "i586-poky-linux"
    MACHINE           = "qemux86"
    DISTRO            = "poky"
    DISTRO_VERSION    = "1.4+snapshot-20130811"
    TUNE_FEATURES     = "m32 i586"
    TARGET_FPU        = ""
    meta              
    meta-yocto        
    meta-yocto-bsp    = "master:f63e7f4323368c0d6fe7a1d44393a7e15652d4f2"
    
    NOTE: Resolving any missing task queue dependencies
    NOTE: Preparing runqueue
    NOTE: Executing SetScene Tasks
    NOTE: Executing RunQueue Tasks
    WARNING: Failed to fetch URL
    http://www.apache.org/dist/subversion/subversion-1.7.10.tar.bz2, attempting
    MIRRORS if available
    NOTE: validating kernel config, see log.do_kernel_configcheck for details
    NOTE: Tasks Summary: Attempted 1675 tasks of which 502 didn't need to be
    rerun and all succeeded.

    Summary: There were 2 WARNING messages shown.

After this qemux86 kernel and root filesystem have been generated. To test these
poky script runqemu can be used (this needs sudo permission for files
poky-git/scripts/runqemu-if{up,down}).

    $ runqemu qemux86
    Continuing with the following parameters:
    KERNEL: [/mnt/oldhome/embed/build/tmp/deploy/images/bzImage-qemux86.bin]
    ROOTFS: [/mnt/oldhome/embed/build/tmp/deploy/images/core-image-minimal-qemux86.ext3]
    FSTYPE: [ext3]
    Setting up tap interface under sudo
    Acquiring lockfile for tap0...
    Running qemu-system-i386...
    /mnt/oldhome/embed/build/tmp/sysroots/x86_64-linux/usr/bin/qemu-system-i386
    -kernel /mnt/oldhome/embed/build/tmp/deploy/images/bzImage-qemux86.bin -net
    nic,vlan=0 -net tap,vlan=0,ifname=tap0,script=no,downscript=no -hda
    /mnt/oldhome/embed/build/tmp/deploy/images/core-image-minimal-qemux86.ext3
    -show-cursor -usb -usbdevice wacom-tablet -vga vmware -no-reboot -m 128
    --append "vga=0 uvesafb.mode_option=640x480-32 root=/dev/hda rw mem=128M
    ip=192.168.7.2::192.168.7.1:255.255.255.0 oprofile.timer=1 "
    Set 'tap0' nonpersistent
    Releasing lockfile of preconfigured tap device 'tap0'

Seems to work. Next testing on the wandboard.

