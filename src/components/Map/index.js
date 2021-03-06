import React, { Component, Fragment } from "react";
import { View, Dimensions, PermissionsAndroid, Image } from "react-native";
import MapView, { Marker, LocalTile } from "react-native-maps";
import Geocoder from "react-native-geocoding";

import markerImage from "../../assets/marker.png";
import backImage from "../../assets/back.png";

import {
  LocationBox,
  LocationText,
  LocationTimeBox,
  LocationTimeText,
  LocationTimeTextSmall,
  Back
} from "./styles";

import Search from "../Search";
import Directions from "../Directions";
import Details from "../Details";

import { getPixelSize } from "../../utils";
import config from "../../config";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

Geocoder.init(config.maps_api_key);

export default class Map extends Component {
  state = {
    region: null,
    destination: null,
    duration: 0,
    location: null,
    travelPrice: null
  };
  async componentDidMount() {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted) {
      try {
        navigator.geolocation.getCurrentPosition(
          async position => {
            const { coords } = position;
            const { latitude, longitude } = coords;
            const response = await Geocoder.from({ latitude, longitude }).catch(
              error => console.error(error)
            );
            const address = response.results[0].formatted_address;
            const location = address.substring(0, address.indexOf(","));
            this.setState({
              region: {
                latitude,
                longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA
              },
              location
            });
          },
          error => {
            // See error code charts below.
            console.log(error.code, error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (e) {
        console.error(
          "An error ocurred while trying to get the current position"
        );
      }
    } else {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }
  }
  handleLocationSelected = (data, { geometry }) => {
    const {
      location: { lat: latitude, lng: longitude }
    } = geometry;
    this.setState({
      destination: {
        latitude,
        longitude,
        title: data.structured_formatting.main_text
      }
    });
  };
  handleBack = () => {
    this.setState({ destination: null });
  };
  render() {
    const { region, destination, duration, location } = this.state;
    return (
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={region}
          region={region}
          showsUserLocation
          loadingEnabled
          ref={el => (this.mapView = el)}
        >
          {destination && (
            <Fragment>
              <Directions
                origin={region}
                destination={destination}
                onReady={result => {
                  const d = Math.floor(result.duration);
                  const price = (d * 1.23).toFixed(2);
                  this.setState({ duration: d, travelPrice: price });
                  this.mapView.fitToCoordinates(result.coordinates, {
                    edgePadding: {
                      top: getPixelSize(50),
                      bottom: getPixelSize(50),
                      left: getPixelSize(50),
                      right: getPixelSize(350)
                    }
                  });
                }}
              />
              <Marker coordinate={region} anchor={{ x: 0, y: 0 }}>
                <LocationBox>
                  <LocationTimeBox>
                    <LocationTimeText>{duration}</LocationTimeText>
                    <LocationTimeTextSmall>MIN</LocationTimeTextSmall>
                  </LocationTimeBox>
                  <LocationText>{location}</LocationText>
                </LocationBox>
              </Marker>
              <Marker
                coordinate={destination}
                anchor={{ x: 0, y: 0 }}
                image={markerImage}
              >
                <LocationBox>
                  <LocationText>{destination.title}</LocationText>
                </LocationBox>
              </Marker>
            </Fragment>
          )}
        </MapView>
        {destination ? (
          <Fragment>
            <Back onPress={this.handleBack}>
              <Image source={backImage} />
            </Back>
            <Details price={this.state.travelPrice} />
          </Fragment>
        ) : (
          <Search onLocationSelected={this.handleLocationSelected} />
        )}
      </View>
    );
  }
}
