========================
box     css   .container
trigger css   .trigger
popup   css   .popup
========================

@ *
------------------------
box
  visible
  
trigger
  visible
  inside: box
  above: popup
  
popup
  visible
  inside: box
  below: trigger
