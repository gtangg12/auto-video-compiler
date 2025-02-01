# ... existing code ...

import openai
import os
import dotenv
from moviepy import VideoFileClip, concatenate_videoclips
from datetime import datetime
from openai import OpenAI
dotenv.load_dotenv()

def extract_audio(video_path):
    """
    Extract audio from a video file and save it as MP3.
    Returns the path to the extracted audio file.
    """
    try:
        video = VideoFileClip(video_path)
        audio_path = video_path.rsplit('.', 1)[0] + '.mp3'
        video.audio.write_audiofile(audio_path)
        video.close()
        return audio_path
    except Exception as e:
        print(f"Error extracting audio: {str(e)}")
        return None

def generate_transcript(audio_path):
    """
    Generate transcript from video file using OpenAI's Whisper model.
    Returns the transcript text or None if failed.
    """
    try:
        print("Generating transcript...")
        # Initialize OpenAI client
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Check if file exists
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
        # Open the audio file
        with open(video_path, "rb") as audio_file:
            # Make the API call with proper error handling
            try:
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            except Exception as api_error:
                print(f"API call failed: {str(api_error)}")
                return None
                
        # Check if we got a valid response
        if response and hasattr(response, 'text'):
            return response.text
        else:
            print("Invalid response format from API")
            return None
            
    except Exception as e:
        print(f"Error generating transcript: {str(e)}")
        return None

def extract_clips(video_path, timestamp_pairs):
    """
    Extract video clips based on start and end timestamps.
    Args:
        video_path: Path to the video file
        timestamp_pairs: List of tuples containing (start_time, end_time) in seconds
    Returns:
        str: Path to output directory containing the clips
    """

    print("Extracting clips...")
    try:
        # Create output directory with current timestamp
        current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = f"output_{current_time}"
        os.makedirs(output_dir, exist_ok=True)
        

        
        # Extract each clip
        for idx, (start_time, end_time) in enumerate(timestamp_pairs, 1):
            try:
                # Load video
                video = VideoFileClip(video_path)
                # Extract the subclip using subclip method - using start and end instead of t_start and t_end
                clip = video.subclipped(start_time, end_time)
                
                # Generate output path
                output_path = os.path.join(output_dir, f"trimmed_clip_{idx}.mp4")
                
                # Write the clip without the progress_bar parameter
                clip.write_videofile(output_path, 
                                   codec='libx264', 
                                   audio_codec='aac',
                                   temp_audiofile=f'{output_dir}/temp-audio.m4a',
                                   remove_temp=True)
                
                # Close the subclip to free memory
                clip.close()
                
            except Exception as e:
                print(f"Error processing clip {idx}: {str(e)}")
                continue
        
        # Close the main video
        video.close()
        
        return output_dir
    except Exception as e:
        print(f"Error extracting clips: {str(e)}")
        return None

def merge_clips(directory, output_filename):
    """
    Merge all MP4 clips in the specified directory into a single video file.
    Args:
        directory: Path to the directory containing the clips
        output_filename: Desired name for the merged video file
    Returns:
        str: Path to the merged video file, or None if no clips found
    """
    try:
        # Find all MP4 files in the directory
        clips = [f for f in os.listdir(directory) if f.endswith(('.mp4', '.MP4'))]
        
        if not clips:
            print("No clips found in the specified directory.")
            return None
        
        # Sort clips to maintain order
        clips.sort()
        
        # Load and concatenate clips
        clips_list = [VideoFileClip(os.path.join(directory, clip)) for clip in clips]
        final_clip = concatenate_videoclips(clips_list)
        
        # Save the merged video
        output_path = os.path.join(directory, output_filename)
        final_clip.write_videofile(output_path, codec='libx264', audio_codec='aac')
        
        # Clean up resources
        for clip in clips_list:
            clip.close()
        final_clip.close()
        
        return output_path
    except Exception as e:
        print(f"Error merging clips: {str(e)}")
        return None