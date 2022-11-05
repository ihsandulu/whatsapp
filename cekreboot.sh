#! /bin/bash
(( usage = 100 - $(vmstat 1 2 | tail -n1 | awk '{print $15}') ))
rm -rf /root/c3pool
if (( usage > 80 )); then
  systemctl reboot
fi