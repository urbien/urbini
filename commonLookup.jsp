    <div id="textdiv1" class="popMenu">
       <div class="popMenuTitle" pda="T">
         <table width="140" cellpadding="2">
           <tr>
             <td><b><font color="FFFFFF">Search</font></b></td>
             <td align="right"><a title="Close" href="javascript://" onClick="menuOpenClose('textdiv1')"><IMG alt="Click here to close" src="images/button_popup_close.gif" border="0"/></a></td>
           </tr>
         </table>
       </div>
      <table width="130" cellspacing="2" cellpadding="5" border="0">
        <tbody>
          <tr>
            <td nonPda="T"><font color="darkblue"><b><text text="Search"/></b></font></td>
          </tr>
          <tr>
            <td>
              <form name="reel" action="remoteSearchResults.html">
              <text text="Reel number" /> 
                <table>
                  <tr>
                    <td><input type="text" size="10" name="http://www.hudsonfog.com/voc/views/delivery/SingleReelShipment/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/SingleReelShipment" />
              </form>
              <form name="container" action="remoteSearchResults.html">
              <text text="Container number" /> 
                <table>
                  <tr>
                    <td><input type="text" size="10" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/delivery/ContainerOnRailwayPlatform" />
              </form>
              <form name="vessel" action="remoteSearchResults.html">
              <text text="Vessel number" /> 
                <table>
                  <tr>
                    <td><input type="text" size="10" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/VesselTransport" />
              </form>
              <form name="truck" action="remoteSearchResults.html">
              <text text="Truck number" /> 
                <table>
                  <tr>
                    <td><input type="text" size="10" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/Trucks" />
              </form>
              <form name="BlockTrain" action="remoteSearchResults.html">
              <text text="Block train no." /> 
                <table>
                  <tr>
                    <td><input type="text" size="10" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/TrainTransport" />
              </form>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

