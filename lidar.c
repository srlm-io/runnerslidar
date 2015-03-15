/*
 * Author: Brendan Le Foll <brendan.le.foll@intel.com>
 * Copyright (c) 2014 Intel Corporation.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

#include <stdio.h>
#include <string.h>

#include "mraa.h"
#include "mraa/gpio.h"
#include "math.h"

#define MAX_BUFFER_LENGTH 6

#define LIDARLite_ADDRESS   0x62          // Default I2C Address of LIDAR-Lite.
#define RegisterCommand     0x00
#define RegisterStatus      0x01
#define RegisterHighByte    0x0f
#define RegisterLowByte     0x10
#define RegisterHighLowB    0x8f          // Register to get both High and Low bytes in 1 call.

int led_state = 0;
mraa_gpio_context led = 0;
mraa_i2c_context i2c = 0;

const char * to_string(mraa_result_t e)
{
  const char * string = "";

  switch( e )
  {
  case MRAA_SUCCESS:
    string = "MRAA_SUCCESS ";
    break;

  case MRAA_ERROR_FEATURE_NOT_IMPLEMENTED:
    string = "MRAA_ERROR_FEATURE_NOT_IMPLEMENTED ";
    break;

  case MRAA_ERROR_FEATURE_NOT_SUPPORTED:
    string = "MRAA_ERROR_FEATURE_NOT_SUPPORTED ";
    break;

  case MRAA_ERROR_INVALID_VERBOSITY_LEVEL:
    string = "MRAA_ERROR_INVALID_VERBOSITY_LEVEL ";
    break;

  case MRAA_ERROR_INVALID_PARAMETER:
    string = "MRAA_ERROR_INVALID_PARAMETER ";
    break;

  case MRAA_ERROR_INVALID_HANDLE:
    string = "MRAA_ERROR_INVALID_HANDLE ";
    break;

  case MRAA_ERROR_NO_RESOURCES:
    string = "MRAA_ERROR_NO_RESOURCES ";
    break;

  case MRAA_ERROR_INVALID_RESOURCE:
    string = "MRAA_ERROR_INVALID_RESOURCE ";
    break;

  case MRAA_ERROR_INVALID_QUEUE_TYPE:
    string = "MRAA_ERROR_INVALID_QUEUE_TYPE ";
    break;

  case MRAA_ERROR_NO_DATA_AVAILABLE:
    string = "MRAA_ERROR_NO_DATA_AVAILABLE ";
    break;

  case MRAA_ERROR_INVALID_PLATFORM:
    string = "MRAA_ERROR_INVALID_PLATFORM ";
    break;

  case MRAA_ERROR_PLATFORM_NOT_INITIALISED:
    string = "MRAA_ERROR_PLATFORM_NOT_INITIALISED";
    break;

  case MRAA_ERROR_PLATFORM_ALREADY_INITIALISED:
    string = "MRAA_ERROR_PLATFORM_ALREADY_INITIALISED ";
    break;

  case MRAA_ERROR_UNSPECIFIED:
    string = "MRAA_ERROR_UNSPECIFIED ";
    break;
  }

  return string;
}

void setup_led()
{
  led = mraa_gpio_init(13);
  mraa_gpio_dir(led, MRAA_GPIO_OUT);
}

void blink()
{
  led_state = !led_state;
  mraa_gpio_write(led, led_state);
}

void setup_lasor()
{
  i2c = mraa_i2c_init(0);
  mraa_i2c_frequency(i2c, MRAA_I2C_STD);

  mraa_i2c_address(i2c, LIDARLite_ADDRESS);
  mraa_i2c_write_byte_data(i2c, 0x00, RegisterCommand);  // reset
}

uint16_t get_distance()
{
  uint16_t distance = 0;
  mraa_result_t rv = MRAA_SUCCESS;

  mraa_i2c_address(i2c, LIDARLite_ADDRESS);
  mraa_i2c_write_byte_data(i2c, 0x04, RegisterCommand);

  uint8_t status = 0;
  uint8_t count = 0;

  while((status == 0) && (count++ < 50))
  {
    mraa_i2c_address(i2c, LIDARLite_ADDRESS);
    status = mraa_i2c_read_byte_data(i2c, RegisterStatus);
    usleep(5000); // 5 ms
  }

  mraa_i2c_address(i2c, LIDARLite_ADDRESS);
  uint8_t hi = mraa_i2c_read_byte_data(i2c, RegisterHighByte);

  mraa_i2c_address(i2c, LIDARLite_ADDRESS);
  uint8_t low = mraa_i2c_read_byte_data(i2c, RegisterLowByte);

  distance = (hi << 8) + low;

  return distance;
}

int main(int argc, char **argv)
{
  mraa_init();

  setup_led();
  setup_lasor();

  uint16_t last = 0;
  uint16_t current = 0;
  uint16_t diff = 0;
  float speed = 0.0;
  float interval = 50.0;

  while( 1 )
  {
    blink();

    current = get_distance();
    diff = last - current;
    speed = diff / interval;

    printf("{");
    printf("'Speed':%f,", speed);
    printf("'time':%d, ", time(0));
    printf("'Distance':%d", current);
//    printf("'Last':%d, ", last);
//    printf("'Diff':%d, ", diff);
    printf("}\n");

    last = current;

    usleep(interval * 1000);
  }
}
