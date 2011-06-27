<div>
    <text text="Dear" /> <property name="sender.firstName" href="y" /> <property name="sender.lastName" href="y" />
    <br/>
		<b>This is confirmation notice of your online actions.</b>
		<br/>
		You modified:
    <property name="forum" type="y"/>  <property name="forum" href="y" noIcon="y"/> 
    <br/><br/>
    <where value="modification != null">
      <br/>
      <property name="modification.newValues" noIcon="y"/>
      <br/>
    </where>
    <where value="modification == null">
      <br/>
        <property name="description" noIcon="y"/>
      <br/>
    </where>
</div></div>