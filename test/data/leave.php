<?php
include_once("common.php");
if($connection["ticket"] == gp("ticket") && !empty($id)){
	echo "ok";
}else{
	header("HTTP/1.0 404 Not Found");
	echo "No client.";
}
?>