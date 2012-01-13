<?php
$_pluginInfo=array(
	'name'=>'MSN',
	'version'=>'1.0.3',
	'description'=>"Get the contacts from a MSN People",
	'base_version'=>'1.8.4',
	'type'=>'email',
	'check_url'=>'http://home.mobile.live.com/',
	'requirement'=>'email',
	'allowed_domains'=>false,
	'imported_details'=>array('first_name','email_1'),
	);
/**
 * MSN Plugin
 * 
 * Imports user's contacts from MSN People
 * 
 * @author OpenInviter
 * @version 1.4.4
 */
class msn extends OpenInviter_Base
	{
	private $login_ok=false;
	public $showContacts=true;
	public $internalError=false;
	protected $timeout=30;	
	protected $userAgent='Mozilla/4.1 (compatible; MSIE 5.0; Symbian OS; Nokia 3650;424) Opera 6.10  [en]';
	
	public $debug_array=array(
				'initial_get'=>'PPFT',
				'url_login'=>'srf_uPost',
				'post_login'=>'function OnBack()',
				'url_people'=>'SecondaryText',
				'get_contacts'=>'BoldText'
				);
	
	/**
	 * Login function
	 * 
	 * Makes all the necessary requests to authenticate
	 * the current user to the server.
	 * 
	 * @param string $user The current user.
	 * @param string $pass The password for the current user.
	 * @return bool TRUE if the current user was authenticated successfully, FALSE otherwise.
	 */
	function login($user,$pass)
		{
		$this->resetDebugger();
		$this->service='msn';
		$this->service_user=$user;
		$this->service_password=$pass;
		if (!$this->init()) return false;
		$url='https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=11&ct=1308560124&rver=6.1.6206.0&wp=MBI&wreply=http:%2F%2Fcid-5305094c4e322785.profile.live.com%2Fcontacts%3Fwa%3Dwsignin1.0%26lc%3D1033&lc=1033&id=73625&pcexp=false&mkt=en-US';		
		$res=$this->get($url,true);		
		if ($this->checkResponse('initial_get',$res))
			$this->updateDebugBuffer('initial_get',$url,'GET');
		else 
			{
			$this->updateDebugBuffer('initial_get',$url,'GET',false);
			$this->debugRequest();
			$this->stopPlugin();
			return false;	
			}
		$post_action=$this->getElementString($res,"srf_uPost='","'");
		preg_match('#name\=\"PPFT\" id\=\"(.+)\" value\=\"(.+)\"#U',$res,$matches);
		$post_elements=array('PPFT'=>$matches[2],
							 'LoginOptions'=>1,
							 'NewUser'=>1,
							 'MobilePost'=>1,
							 'PPSX'=>'P',
							 'PwdPad'=>'',
							 'type'=>11,
							 'i3'=>25228,
							 'm1'=>1280,
							 'm2'=>1024,
							 'm3'=>0,
							 'i12'=>1,
							 'login'=>$user,
							 'passwd'=>$pass				 
							);
		$res=$this->post($post_action,$post_elements);
		if ($this->checkResponse('post_login',$res)) $this->updateDebugBuffer('login_post',"{$post_elements}",'POST',true,$post_elements);
		else{
			$this->updateDebugBuffer('post_login',"{$post_action}",'POST',false,$post_elements);	
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		$this->login_ok='http://profile.live.com/contacts';
		return true;
		}

	/**
	 * Get the current user's contacts
	 * 
	 * Makes all the necesarry requests to import
	 * the current user's contacts
	 * 
	 * @return mixed The array if contacts if importing was successful, FALSE otherwise.
	 */	
	public function getMyContacts()
		{
		if (!$this->login_ok)
			{
			$this->debugRequest();
			$this->stopPlugin();
			return false;
			}
		else $url=$this->login_ok;		
		$res=$this->get($url,true);		
		if ($this->checkResponse('url_people',$res)) $this->updateDebugBuffer('url_people',$url,'GET');
		else{
			$this->updateDebugBuffer('url_people',$url,'GET',false);
			$this->debugRequest();
			$this->stopPlugin();
			return false;	
			}
		$maxNumberContacts_bulk=$this->getElementString($res,'id="lh" class="SecondaryText">','<');
		$maxNumberContacts_array=explode(" ",$maxNumberContacts_bulk);
		$maxNumberContacts=0;
		foreach ($maxNumberContacts_array as $item) if (is_numeric(str_replace(')','',$item))) $maxNumberContacts=max(intval(str_replace(')','',$item)),$maxNumberContacts);
		if (empty($maxNumberContacts)) return array();
		$page=0;$contor=0;$contacts=array();
		while ($contor<=$maxNumberContacts)
			{
			$page++;$contor++;;
			$url_next="http://mprofile.live.com/default.aspx?pg={$page}";
			if (preg_match_all("#class\=\"BoldText\" href\=\"\/contactinfo\.aspx\?contactid\=(.+)\"\>#U",$res,$matches))
				{
				if (!empty($matches[1]))
					foreach($matches[1] as $id)
						{
						$name=false;$email=false;
						$res=$this->get("http://mprofile.live.com/contactinfo.aspx?contactid={$id}");
						if (!empty($res))
							{							
							$name=$this->getElementString($res,'class="PageTitle">','<');
							preg_match_all('#mkt\=\"(.+)\" id\=\"(.+)\"\>(.+)\<#U',$res,$emails);
							if ((!empty($name)) AND (!empty($emails[2]))) $contacts[$emails[2]]=array('first_name'=>$name,'email_1'=>$emails[2]);							
							}
						}
				}
			$res=$this->get($url_next,true);
			}
		foreach ($contacts as $email=>$name) if (!$this->isEmail($email)) unset($contacts[$email]);
		return $this->returnContacts($contacts);
		}

	/**
	 * Terminate session
	 * 
	 * Terminates the current user's session,
	 * debugs the request and reset's the internal 
	 * debudder.
	 * 
	 * @return bool TRUE if the session was terminated successfully, FALSE otherwise.
	 */	
	public function logout()
		{
		if (!$this->checkSession()) return false;
		$res=$this->get('http://mpeople.live.com/default.aspx?pg=0&PreviewScreenWidth=176',true);
		$url_logout=html_entity_decode($this->getElementString($res,'<a id="SignOutLink" href="','"'));
		$res=$this->get($url_logout,true);
		$this->debugRequest();
		$this->resetDebugger();
		$this->stopPlugin();
		return true;
		}
		
	}
?>