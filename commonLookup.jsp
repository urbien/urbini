    <div id="textdiv1" class="popMenu">
       <div class="popMenuTitle" pda="T">
         <table width="120" cellpadding="2">
           <tr>
             <td><b><font color="FFFFFF">Search</font></b></td>
             <td align="right"><a title="Close" href="javascript://" onClick="menuOpenClose('textdiv1')"><IMG alt="Click here to close" src="images/button_popup_close.gif" border="0"/></a></td>
           </tr>
         </table>
       </div>
      <table width="110" cellspacing="2" cellpadding="5" border="0">
        <tbody>
          <tr>
            <td nonPda="T"><font color="darkblue"><b><text text="Search"/></b></font></td>
          </tr>
          <tr>
            <td>
              <form name="reel" action="localSearchResults.html">
              <text text="Reel #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/paper/products/Reel/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <!--input type="hidden" name="action" value="searchParallel" /-->
                <input type="hidden" name="action" value="searchLocal" />
                <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/top/FulfillmentItem" />
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/ReelFormat"/>
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/Reel"/>
              </form>
              <form name="reel" action="remoteSearchResults.html">
              <text text="Reel # (for tracking)" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/paper/products/Reel/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" />
                <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/top/FulfillmentItem" />
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/ReelFormat"/>
                <input type="hidden" name="interface" value="http://www.hudsonfog.com/voc/paper/products/Reel"/>
              </form>
              <form name="container" action="remoteSearchResults.html">
              <text text="Container #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/model/delivery/ContainerOnRailwayPlatform" />
              </form>
              <form name="vessel" action="remoteSearchResults.html">
              <text text="Vessel #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/VesselTransport" />
              </form>
              <form name="truck" action="remoteSearchResults.html">
              <text text="Truck #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/Trucks" />
              </form>
              <form name="BlockTrain" action="remoteSearchResults.html">
              <text text="Block train #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/model/delivery/Transport/vehicle" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/TrainTransport" />
              </form>
              <form name="BL" action="remoteSearchResults.html">
              <text text="BL #" /> 
                <table>
                  <tr>
                    <td><input type="text" size="7" name="http://www.hudsonfog.com/voc/views/delivery/BillOfLading2/number" value="" class="text" /></td>
                    <td valign="middle"><input type="image" border="0" width="28" src="images/gogif.gif" name="submit" /> </td>
                  </tr>
                </table>
                <input type="hidden" name="action" value="searchParallel" /> <input type="hidden" name="type" value="http://www.hudsonfog.com/voc/views/delivery/BillOfLading2" />
              </form>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

