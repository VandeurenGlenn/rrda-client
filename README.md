# rrda
> Remote relay dimming api

## Example

### Components
- resistors 5K, 10K, 20K, 30K, 50K
- 8 way relay
- rpi

### Wiring
![RPI WIRING MEANWELL NPF](https://raw.githubusercontent.com/VandeurenGlenn/rrda/master/rrda-rpi_wiring_meanwell_NPF.svg?sanitize=true)


### Setup
Open rc.local
```sh
sudo nano /etc/rc.local
```
and add

`iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 6767`
`iptables -t nat -A PREROUTING -i wlan0 -p tcp --dport 80 -j REDIRECT --to-port 6767`

### TODO
- [ ] rpi zero w image
